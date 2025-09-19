use serde_json::json;

use crate::error::TauriError;
use tauri::Manager;
use tauri_plugin_store::StoreExt;

const STORE_PATH: &str = "preferences.dat";

pub fn into_tauri_theme(theme: &str) -> Option<tauri::Theme> {
    match theme {
        "light" => Some(tauri::Theme::Light),
        "dark" => Some(tauri::Theme::Dark),
        _ => None,
    }
}

#[tauri::command]
#[specta::specta]
pub fn set_theme(window: tauri::Window, theme: &str) -> Result<(), TauriError> {
    let tauri_theme = into_tauri_theme(theme);

    window
        .app_handle()
        .store(STORE_PATH)
        .map_err(TauriError::from)
        .inspect(|store| store.set("theme", json!({ "value": theme })))
        .and_then(|_| window.set_theme(tauri_theme).map_err(TauriError::from))
}

#[tauri::command]
#[specta::specta]
pub fn get_theme(app: tauri::AppHandle) -> Option<String> {
    app.store(STORE_PATH)
        .ok()
        .and_then(|store| store.get("theme"))
        .and_then(|theme| theme.get("value")?.as_str().map(|s| s.to_string()))
}
