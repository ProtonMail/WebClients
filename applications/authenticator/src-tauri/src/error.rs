use serde::Serialize;
use specta::Type;

#[derive(Debug, Serialize, Type)]
pub struct TauriError {
    pub message: String,
}

impl From<tauri::Error> for TauriError {
    fn from(error: tauri::Error) -> Self {
        Self {
            message: error.to_string(),
        }
    }
}

impl From<tauri_plugin_store::Error> for TauriError {
    fn from(error: tauri_plugin_store::Error) -> Self {
        Self {
            message: error.to_string(),
        }
    }
}

impl From<&str> for TauriError {
    fn from(message: &str) -> Self {
        Self {
            message: message.to_string(),
        }
    }
}

impl From<String> for TauriError {
    fn from(message: String) -> Self {
        Self { message }
    }
}
