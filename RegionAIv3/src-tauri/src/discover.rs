// 局域网 TCP 指纹扫描模块
// 通过读取本机所有网卡的真实 netmask 计算子网范围，逐子网并发扫描
// 发现目标服务器后立即中止其余请求，不等待全部完成

use regex::Regex; // 正则匹配指纹文本 "regionai platform API on :{port}"
use serde::Serialize; // 返回值的 serde JSON 序列化
use std::net::Ipv4Addr; // IPv4 地址类型
use std::sync::atomic::{AtomicBool, Ordering}; // AtomicBool：跨 spawn 的全局中止标志
use std::sync::Arc; // 跨 spawn 共享引用计数指针
use tokio::sync::Semaphore; // 并发控制：令牌桶限流

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

/// 一个待扫描的 /24 网段前缀（如 "192.168.10"）
type SubnetPrefix = String;

/// 遍历本机所有网卡，读真实 netmask，计算私网 /24 前缀列表
fn collect_subnet_prefixes() -> Vec<SubnetPrefix> {
    let mut prefixes: Vec<SubnetPrefix> = Vec::new(); // 去重列表

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
        // 跳过回环地址
        if ip.is_loopback() {
            continue;
        }
        // 只扫描私网 IP
        if !is_private_ip(&ip.octets()) {
            continue;
        }

        // 从真实 netmask 计算 /24 前缀列表
        let ip_u32 = u32::from(ip); // IP → u32
        let mask_u32 = u32::from(netmask); // 掩码 → u32
        let network_u32 = ip_u32 & mask_u32; // 网络地址 = IP & mask
        let broadcast_u32 = network_u32 | !mask_u32; // 广播地址 = network | ~mask
        let host_count = broadcast_u32.saturating_sub(network_u32).saturating_sub(1); // 可用 host 数
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

    if prefixes.is_empty() {
        log_warn("未发现私网接口，扫描列表为空");
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
    log_info(&format!("开始扫描子网 {}.x 共 254 个 IP", prefix));
    // 共享结果容器：Arc + tokio::sync::Mutex，第一个发现的写入
    let found: Arc<tokio::sync::Mutex<Option<DiscoveredServer>>> =
        Arc::new(tokio::sync::Mutex::new(None));

    let mut handles = Vec::with_capacity(254); // 预分配

    for host in 1u8..=254 {
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
                Err(_) => return, // 超时/连接失败 → 跳过
            };
            let body = match resp.text().await {
                Ok(b) => b,
                Err(_) => return,
            };
            // 指纹匹配
            let api_port = match re.captures(&body) {
                Some(caps) => caps.get(1).unwrap().as_str().to_string(), // 捕获端口号
                None => return, // 非目标服务
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
                Err(_) => return,
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
