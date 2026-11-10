use std::sync::atomic::{AtomicBool, AtomicI64};
use std::sync::Mutex;

use crate::settings::Settings;

/// 全局共享状态（Tauri Managed State）
pub struct AppState {
    /// 钉住：true 时失焦不隐藏，且窗口置顶
    pub pinned: AtomicBool,
    /// 托盘点击抑制时间戳（Unix 毫秒）：点击托盘必然引发窗口 blur，
    /// blur 延迟隐藏前检查当前时间是否早于该值，早于则说明 blur 来自托盘点击，不隐藏
    pub suppress_blur_until_ms: AtomicI64,
    /// 托盘图标句柄，跨天时重绘日期数字
    pub tray_icon: Mutex<Option<tauri::tray::TrayIcon>>,
    /// 前端 ready 前是否已展示过主窗口
    pub shown_once: AtomicBool,
    pub settings: Mutex<Settings>,
}

impl AppState {
    pub fn new(settings: Settings) -> Self {
        Self {
            pinned: AtomicBool::new(settings.pinned),
            suppress_blur_until_ms: AtomicI64::new(0),
            tray_icon: Mutex::new(None),
            shown_once: AtomicBool::new(false),
            settings: Mutex::new(settings),
        }
    }
}
