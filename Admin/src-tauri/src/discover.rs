// 局域网 TCP 指纹扫描模块
// 通过读取本机所有网卡的真实 netmask 计算子网范围，逐子网并发扫描
// 发现目标服务器后立即中止其余请求，不等待全部完成

use regex::Regex; // 正则匹配指纹文本 "regionai platform API on :{port}"
use serde::Serialize; // 返回值的 serde JSON 序列化
use std::collections::HashSet; // 有网关接口 IP 集合：去重存储
use std::net::Ipv4Addr; // IPv4 地址类型
use std::sync::atomic::{AtomicBool, Ordering}; // AtomicBool：跨 spawn 的全局中止标志
use std::sync::Arc; // 跨 spawn 共享引用计数指针
use tokio::sync::Semaphore; // 并发控制：令牌桶限流
// Windows 专属：为子进程设置创建标志（CREATE_NO_WINDOW），防止 GUI 父进程 spawn 控制台程序时闪现黑窗口
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

// ============================================================================
// 返回类型
// ============================================================================

/// 扫描发现的服务器，字段名 camelCase 序列化给前端
#[derive(Debug, Clone, Serialize)]
pub struct DiscoveredServer {
    ip: String, // IPv4 地址
    #[serde(rename = "apiPort")]
    api_port: String, // API 端口 — 从指纹正则提取
    #[serde(rename = "dbPort")]
    db_port: String, // NocoBase 端口 — /regionai/identify 返回
    #[serde(rename = "imPort")]
    im_port: String, // Matrix 端口 — /regionai/identify 返回
}

// ============================================================================
// 常量
// ============================================================================

const SCAN_TIMEOUT_MS: u64 = 800; // 单请求超时毫秒数
const IDENTIFY_TIMEOUT_MS: u64 = 800; // identify 请求超时
const MAX_CONCURRENT: usize = 30; // 最大并发连接数
/// 指纹正则模式
const FINGERPRINT_PATTERN: &str = r"regionai platform API on :(\d+)";

// ============================================================================
// 日志辅助：通过 println! 输出带前缀的日志，Tauri dev 可见
// ============================================================================

fn log_info(msg: &str) {
    println!("[INFO] [RegionAI:discover.rs] {}", msg);
}
fn log_warn(msg: &str) {
    println!("[WARN] [RegionAI:discover.rs] {}", msg);
}
fn log_error(msg: &str) {
    println!("[ERROR] [RegionAI:discover.rs] {}", msg);
}

// ============================================================================
// 子网计算：从所有网卡的真实 netmask 计算实际扫描范围
// ============================================================================

/// 判断 IP 是否为私网地址
fn is_private_ip(octets: &[u8; 4]) -> bool {
    if octets[0] == 10 {
        return true; // 10.0.0.0/8
    }
    if octets[0] == 172 && octets[1] >= 16 && octets[1] <= 31 {
        return true; // 172.16.0.0/12
    }
    if octets[0] == 192 && octets[1] == 168 {
        return true; // 192.168.0.0/16
    }
    false
}

/// 通过系统命令解析"有网关的接口 IP"集合
/// 统计 route print -4 中网关列为真实 IPv4（非 0.0.0.0、非 on-link/在链路上）的路由行，
/// 取其"接口"列 IP 作为"有网关"的判定依据。
fn collect_gateway_interface_ips() -> HashSet<String> {
    let mut gateway_ips: HashSet<String> = HashSet::new(); // 去重集合

    // 仅 Windows 支持 route print；其它平台无法可靠解析网关，返回空（此时不启用网关过滤）
    #[cfg(target_os = "windows")]
    {
        let output = std::process::Command::new("route")
            .arg("print")
            .arg("-4")
            // GUI 父进程下 spawn 控制台子进程默认会闪黑窗口，加 CREATE_NO_WINDOW(0x08000000) 隐藏
            .creation_flags(0x08000000)
            .output();
        let text = match output {
            Ok(o) => String::from_utf8_lossy(&o.stdout).to_string(),
            Err(e) => {
                log_warn(&format!("route print 执行失败，本次不启用网关过滤: {}", e));
                return gateway_ips;
            }
        };
        log_info(&format!("route print -4 输出共 {} 行", text.lines().count()));
        // 逐行解析路由表：5 列分别为 dest、mask、gateway、interface、metric
        for line in text.lines() {
            let cols: Vec<&str> = line.split_whitespace().collect();
            if cols.len() < 5 {
                continue; // 非路由数据行（表头/分隔线等）跳过
            }
            let gateway = cols[2]; // 网关列
            let iface = cols[3]; // 接口列（接口 IP）
            // 网关必须是真实 IPv4（on-link/在链路上等文本会解析失败）
            let is_ip = gateway.parse::<Ipv4Addr>().is_ok();
            if is_ip && gateway != "0.0.0.0" {
                gateway_ips.insert(iface.to_string()); // 记录该接口为有网关
            }
        }
        // 打印解析出的有网关接口，便于核对网关过滤结果
        log_info(&format!("解析出有网关的接口 IP 集合: {:?}", gateway_ips));
    }

    #[cfg(not(target_os = "windows"))]
    {
        log_warn("非 Windows 平台不启用网关过滤");
    }

    gateway_ips
}

/// 一个待扫描的 /24 网段前缀（如 "192.168.10"）
type SubnetPrefix = String;

/// 遍历本机所有网卡，读真实 netmask，计算私网 /24 前缀列表
fn collect_subnet_prefixes() -> Vec<SubnetPrefix> {
    let mut prefixes: Vec<SubnetPrefix> = Vec::new(); // 去重列表

    // 解析"有网关的接口 IP"集合：仅 IPv4、网关、掩码同时存在的接口才纳入扫描范围
    let gateway_ips = collect_gateway_interface_ips();

    // 获取所有网络接口
    let interfaces = match get_if_addrs::get_if_addrs() {
        Ok(v) => v, // 成功
        Err(e) => {
            log_error(&format!("获取网络接口失败: {}", e));
            return prefixes; // 返回空列表
        }
    };

    // 遍历每个接口
    for iface in interfaces {
        // 只处理 IPv4
        let (ip, netmask) = match iface.addr {
            get_if_addrs::IfAddr::V4(v4) => (v4.ip, v4.netmask), // 解构 IPv4 地址和掩码
            _ => continue, // 跳过 IPv6
        };
        // 记录接口基本信息，便于排查为何纳入/跳过扫描
        log_info(&format!(
            "检查接口 {}: ip={} mask={} 回环={} 私网={} 有网关={}",
            iface.name,
            ip,
            netmask,
            ip.is_loopback(),
            is_private_ip(&ip.octets()),
            gateway_ips.contains(&ip.to_string())
        ));
        // 跳过回环地址
        if ip.is_loopback() {
            log_info(&format!("跳过回环接口: {}", ip));
            continue;
        }
        // 只扫描私网 IP
        if !is_private_ip(&ip.octets()) {
            log_info(&format!("跳过非私网接口: {}", ip));
            continue;
        }
        // 掩码必须有效（非 0.0.0.0），否则视为缺掩码跳过
        if u32::from(netmask) == 0 {
            log_warn(&format!("跳过无有效掩码接口: {}", ip));
            continue;
        }
        // 接口必须有网关（route print 存在真实网关路由）；解析失败为空时不启用该过滤
        if !gateway_ips.is_empty() && !gateway_ips.contains(&ip.to_string()) {
            log_warn(&format!("跳过无网关接口: {}", ip));
            continue;
        }

        // 从真实 netmask 计算 /24 前缀列表
        let ip_u32 = u32::from(ip); // IP → u32
        let mask_u32 = u32::from(netmask); // 掩码 → u32
        let network_u32 = ip_u32 & mask_u32; // 网络地址 = IP & mask
        let broadcast_u32 = network_u32 | !mask_u32; // 广播地址 = network | ~mask
        // 可用 host 数（不减 1，与 Electron 端一致，覆盖到 .255 广播地址）
        let host_count = broadcast_u32.saturating_sub(network_u32);
        // 限制最大扫描范围
        let host_count = host_count.min(65535);

        // 从网络地址开始，以 /24 为单位切分
        let mut offset = 0u32; // 当前偏移量
        while offset <= host_count {
            // 计算当前 /24 前缀的前三段
            let current_ip = network_u32.saturating_add(offset); // 网络地址 + 偏移
            let o = Ipv4Addr::from(current_ip).octets(); // 取四段
            let prefix = format!("{}.{}.{}", o[0], o[1], o[2]); // /24 前缀
            // 去重加入
            if !prefixes.contains(&prefix) {
                prefixes.push(prefix);
            }
            // 跳到下一个 /24 的起始地址
            offset = offset.saturating_add(256);
        }

        log_info(&format!(
            "网卡 {}: ip={} mask={} host_count={} /24前缀数={}",
            iface.name,
            ip,
            netmask,
            host_count,
            prefixes.len()
        ));
    }

    // 汇总最终纳入扫描的 /24 子网列表，便于核对扫描范围
    log_info(&format!("最终纳入扫描的子网前缀: {:?}", prefixes));
    if prefixes.is_empty() {
        log_warn("未发现可扫描子网，扫描列表为空");
    }

    prefixes
}

// ============================================================================
// 单子网扫描
// ============================================================================

/// 扫描一个 /24 子网，发现后通过 abort 标志通知其他任务停止
async fn scan_slash_24(
    prefix: &str, // /24 前缀，如 "192.168.10"
    client: &reqwest::Client, // HTTP 客户端
    semaphore: &Arc<Semaphore>, // 并发控制信号量
    fingerprint_re: &Regex, // 预编译指纹正则
    abort: &Arc<AtomicBool>, // 全局中止标志：true 表示已发现，所有任务应停止
) -> Option<DiscoveredServer> {
    log_info(&format!("开始扫描子网 {}.x 共 255 个 IP", prefix));
    // 共享结果容器：Arc + tokio::sync::Mutex，第一个发现的写入
    let found: Arc<tokio::sync::Mutex<Option<DiscoveredServer>>> =
        Arc::new(tokio::sync::Mutex::new(None));

    let mut handles = Vec::with_capacity(255); // 预分配

    for host in 1u8..=255 {
        // 每个 spawn 前检查 abort 标志
        if abort.load(Ordering::Relaxed) {
            break; // 已发现，不再创建新任务
        }

        let ip = format!("{}.{}", prefix, host); // 如 "192.168.10.11"
        let client = client.clone(); // Client 内部 Arc，clone 开销极小
        let sem = Arc::clone(semaphore); // 共享信号量引用计数+1
        let re = fingerprint_re.clone(); // Regex clone
        let abort_ref = Arc::clone(abort); // 共享 abort 标志
        let found_ref = Arc::clone(&found); // 共享结果

        let handle = tokio::spawn(async move {
            // 获信号量许可
            let _permit = sem.acquire().await.unwrap();

            // 再次检查 abort（可能在排队等信号量期间已被发现）
            if abort_ref.load(Ordering::Relaxed) {
                return;
            }

            // === 第一步：GET / 指纹扫描 ===
            let url = format!("http://{}/", ip); // 首页
            let resp = match client
                .get(&url)
                .timeout(std::time::Duration::from_millis(SCAN_TIMEOUT_MS)) // 独立 800ms 超时
                .send()
                .await
            {
                Ok(r) => r,
                Err(e) => {
                    // 记录请求失败原因（区分超时/连接失败/其它），排查为何扫不到目标
                    let reason = if e.is_timeout() {
                        "timeout"
                    } else if e.is_connect() {
                        "connect"
                    } else {
                        "other"
                    };
                    log_info(&format!("  请求失败 ip={} 原因={} 错误={}", ip, reason, e));
                    return;
                }
            };
            let body = match resp.text().await {
                Ok(b) => b,
                Err(_) => return,
            };
            // 指纹匹配
            let api_port = match re.captures(&body) {
                Some(caps) => caps.get(1).unwrap().as_str().to_string(), // 捕获端口号
                None => {
                    // 记录：有 HTTP 响应但指纹不匹配（可能是其它服务或端口不对）
                    let preview: String = body.chars().take(60).collect();
                    log_info(&format!("  非目标服务 ip={} body前60字={:?}", ip, preview));
                    return;
                }
            };

            // === 第二步：调 /regionai/identify（独立超时） ===
            let identify_url = format!("http://{}:{}/regionai/identify", ip, api_port);
            let identify_resp = match client
                .get(&identify_url)
                .timeout(std::time::Duration::from_millis(IDENTIFY_TIMEOUT_MS)) // 独立 800ms
                .send()
                .await
            {
                Ok(r) => r,
                Err(e) => {
                    // 记录：指纹已命中但 identify 请求失败
                    log_info(&format!("  指纹命中但 identify 失败 ip={} 错误={}", ip, e));
                    return;
                }
            };
            let identify_body = match identify_resp.text().await {
                Ok(b) => b,
                Err(_) => return,
            };
            let parsed: serde_json::Value = match serde_json::from_str(&identify_body) {
                Ok(v) => v,
                Err(_) => return,
            };
            let db_port = parsed["db"].as_str().unwrap_or("").to_string();
            let im_port = parsed["im"].as_str().unwrap_or("").to_string();
            if db_port.is_empty() || im_port.is_empty() {
                // 记录：identify 有返回但缺少 db/im 字段
                log_info(&format!("  identify 返回缺 db/im 字段 ip={} body={}", ip, identify_body));
                return;
            }

            // === 构造结果 ===
            let server = DiscoveredServer {
                ip: ip.clone(),
                api_port,
                db_port,
                im_port,
            };

            // === 先写入共享结果，再设 abort（确保结果落盘后才通知其他任务退出） ===
            let mut guard = found_ref.lock().await;
            if guard.is_none() {
                *guard = Some(server); // 结果写入完毕
            }
            // drop guard 释放锁后再设 abort

            abort_ref.store(true, Ordering::Relaxed); // 通知其余 spawn 已发现，可退出
        });

        handles.push(handle);
    }

    // 等待所有已创建的任务完成
    for handle in handles {
        let _ = handle.await;
    }

    // 提取结果
    let guard = found.lock().await;
    guard.clone()
}

// ============================================================================
// Tauri Command
// ============================================================================

/// 局域网服务器发现命令
#[tauri::command]
pub async fn discover_server() -> Result<Vec<DiscoveredServer>, String> {
    // 0. 记录扫描开始时间
    let start = std::time::Instant::now();

    // 1. 采集本机所有私网网卡的真实子网前缀
    let prefixes = collect_subnet_prefixes();
    log_info(&format!("采集到 {} 个 /24 子网前缀", prefixes.len()));

    if prefixes.is_empty() {
        log_warn("无可扫描子网");
        return Ok(vec![]);
    }

    // 2. 创建 HTTP 客户端（不设全局超时，每请求独立超时）
    let client = reqwest::Client::builder()
        .build()
        .map_err(|e| format!("创建 HTTP 客户端失败: {}", e))?;

    // 3. 并发信号量
    let semaphore = Arc::new(Semaphore::new(MAX_CONCURRENT));

    // 4. 全局中止标志
    let abort = Arc::new(AtomicBool::new(false)); // false = 未发现，继续扫描

    // 5. 预编译指纹正则
    let fingerprint_re =
        Regex::new(FINGERPRINT_PATTERN).map_err(|e| format!("正则编译失败: {}", e))?;

    // 6. 逐子网扫描，发现即返回（abort 标志让已 spawn 的任务快速跳过）
    for prefix in &prefixes {
        log_info(&format!("扫描子网: {}.x", prefix));
        let result =
            scan_slash_24(prefix, &client, &semaphore, &fingerprint_re, &abort).await;

        if let Some(server) = result {
            log_info(&format!(
                "发现服务器: ip={} api={} db={} im={}, 扫描耗时={}ms",
                server.ip,
                server.api_port,
                server.db_port,
                server.im_port,
                start.elapsed().as_millis()
            ));
            return Ok(vec![server]);
        }
    }

    log_info(&format!(
        "所有子网扫描完成未发现服务器, 总耗时={}ms",
        start.elapsed().as_millis()
    ));
    Ok(vec![])
}
