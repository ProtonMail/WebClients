pub struct Biometrics {}

impl super::BiometricsTrait for Biometrics {
    fn new(_: tauri::AppHandle) -> Self {
        Self {}
    }

    fn can_check_presence(&self) -> Result<bool, isize> {
        Ok(false)
    }

    fn check_presence(&self, _reason: &str) -> Result<(), isize> {
        Err(9999)
    }
}
