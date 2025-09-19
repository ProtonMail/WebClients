use serde::Serialize;
use specta::Type;

#[cfg_attr(target_os = "windows", path = "windows.rs")]
#[cfg_attr(target_os = "macos", path = "macos.rs")]
#[cfg_attr(target_os = "linux", path = "linux.rs")]
mod biometrics_platform;

use biometrics_platform::Biometrics;

trait BiometricsTrait {
    fn new(app: tauri::AppHandle) -> Self;
    fn can_check_presence(&self) -> Result<bool, isize>;
    fn check_presence(&self, reason: &str) -> Result<(), isize>;
}

#[derive(Serialize, Type)]
pub struct BiometricsError {
    code: i32,
}

impl From<isize> for BiometricsError {
    fn from(value: isize) -> Self {
        BiometricsError { code: value as i32 }
    }
}

#[tauri::command(async)]
#[specta::specta]
pub fn can_check_presence(app: tauri::AppHandle) -> Result<bool, BiometricsError> {
    let biometrics = Biometrics::new(app);
    Ok(biometrics.can_check_presence()?)
}

#[tauri::command(async)]
#[specta::specta]
pub fn check_presence(app: tauri::AppHandle, reason: String) -> Result<(), BiometricsError> {
    let biometrics = Biometrics::new(app);
    Ok(biometrics.check_presence(reason.as_str())?)
}
