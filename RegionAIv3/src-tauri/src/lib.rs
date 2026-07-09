use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use chrono::Local;
use tauri::Manager;


#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// ============================================================================
// 前端日志系统
// ============================================================================

/// 确定日志目录：
///   开发 → 系统临时目录/regionaiv3/logs/
///   打包 → <安装目录>/data/logs/
/// 说明：
///   开发态不能写到 src-tauri/ 或其子目录，否则会被 Tauri 文件监听命中，
///   导致“写日志 → 触发重建 → 重启应用 → 再写日志”的死循环。
///   安装后的正式环境则统一写入 data/logs，保持 exe 和卸载程序位于第一层级，
///   其他运行数据位于第二层级。
fn get_log_dir(app_handle: &tauri::AppHandle) -> PathBuf {
    if cfg!(debug_assertions) {
        std::env::temp_dir().join("regionaiv3").join("logs")
    } else {
        app_handle
            .path()
            .resource_dir()
            .expect("failed to resolve resource dir")
            .join("data")
            .join("logs")
    }
}

/// 日切轮转：如果 regionai.app.log 的最后修改日期不是今天，
/// 将其重命名为 regionai.app.log.{修改日期}，下次写入自动创建新文件。
fn rotate_log_if_needed(log_dir: &PathBuf) {
    let current = log_dir.join("regionai.app.log");
    if !current.exists() {
        return;
    }

    let modified = match fs::metadata(&current).and_then(|m| m.modified()) {
        Ok(t) => t,
        Err(_) => return,
    };

    let modified_date = chrono::DateTime::<chrono::Local>::from(modified)
        .format("%Y-%m-%d")
        .to_string();
    let today = Local::now().format("%Y-%m-%d").to_string();

    if modified_date != today {
        let rotated = log_dir.join(format!("regionai.app.log.{}", modified_date));
        fs::rename(&current, &rotated).ok();
    }
}

#[derive(Debug, serde::Deserialize)]
struct LogEntry {
    level: String,
    file_name: String,
    function_name: String,
    message: String,
    details: Option<Vec<String>>,
}

// 获取设备信息（主机名 + 持久化设备 ID），供前端 collectDeviceInfo 调用
#[tauri::command]
fn get_device_info(app_handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    // 系统主机名
    let device_name = hostname::get()
        .map(|h| h.to_string_lossy().to_string())
        .unwrap_or_default();

    // 设备 ID 持久化：首次生成 UUID v4 写入文件，后续读取复用
    let data_dir = app_handle
        .path()
        .app_local_data_dir()
        .map_err(|e| e.to_string())?;
    fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
    let id_file = data_dir.join("device_id");

    let device_id = if id_file.exists() {
        fs::read_to_string(&id_file).unwrap_or_default()
    } else {
        let id = uuid::Uuid::new_v4().to_string();
        fs::write(&id_file, &id).map_err(|e| e.to_string())?;
        id
    };

    Ok(serde_json::json!({
        "deviceName": device_name,
        "deviceId": device_id,
    }))
}

#[tauri::command]
fn write_log(app_handle: tauri::AppHandle, entry: LogEntry) -> Result<(), String> {
    let log_dir = get_log_dir(&app_handle);
    fs::create_dir_all(&log_dir).map_err(|e| e.to_string())?;

    rotate_log_if_needed(&log_dir);

    let timestamp = Local::now()
        .format("%Y-%m-%dT%H:%M:%S%.3f%:z")
        .to_string();
    let prefix = format!(
        "[RegionAI:{}:{}]{}",
        entry.file_name, entry.function_name, entry.message
    );

    let line = match entry.details {
        Some(ref details) if !details.is_empty() => {
            format!(
                "{} [{}] {} {}\n",
                timestamp,
                entry.level.to_uppercase(),
                prefix,
                details.join(" | ")
            )
        }
        _ => format!(
            "{} [{}] {}\n",
            timestamp,
            entry.level.to_uppercase(),
            prefix
        ),
    };

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_dir.join("regionai.app.log"))
        .map_err(|e| e.to_string())?;

    file.write_all(line.as_bytes())
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            #[allow(unused_mut)]
            let mut window_builder = tauri::WebviewWindowBuilder::new(
                app,
                "main",
                if cfg!(debug_assertions) {
                    tauri::WebviewUrl::External(
                        url::Url::parse("http://localhost:1420").unwrap(),
                    )
                } else {
                    tauri::WebviewUrl::App("index.html".into())
                },
            )
            .title("RegionAI")
            .inner_size(1000.0, 600.0)
            .min_inner_size(800.0, 500.0)
            .decorations(false);

            #[cfg(not(debug_assertions))]
            {
                let resource_dir = app
                    .path()
                    .resource_dir()
                    .expect("failed to resolve resource dir");
                let webview_data = resource_dir.join("data").join("EBWebView");
                std::fs::create_dir_all(&webview_data).ok();
                window_builder = window_builder.data_directory(webview_data);
            }

            window_builder.build().expect("failed to build window");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, write_log, get_device_info])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, _event| {});
}
