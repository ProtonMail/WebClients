use anyhow::{bail, Result};

pub struct Biometrics {}

impl super::BiometricsTrait for Biometrics {
    fn can_check_presence() -> Result<bool> {
        bail!("Not implemented")
    }

    fn get_decryption_key(_challenge_b64: Option<&str>) -> Result<[String; 2]> {
        bail!("Not implemented")
    }

    fn check_presence(_handle: Vec<u8>, _reason: String) -> Result<bool> {
        bail!("Not implemented")
    }

    fn get_secret(key: String) -> Result<String> {
        bail!("Not implemented")
    }

    fn set_secret(key: String, data: String) -> Result<()> {
        bail!("Not implemented")
    }

    fn delete_secret(key: String) -> Result<()> {
        bail!("Not implemented")
    }
}
