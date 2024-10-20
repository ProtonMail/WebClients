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

    fn get_secret(_key: String) -> Result<Vec<u8>> {
        bail!("Not implemented")
    }

    fn set_secret(_key: String, _data: Vec<u8>) -> Result<()> {
        bail!("Not implemented")
    }

    fn delete_secret(_key: String) -> Result<()> {
        bail!("Not implemented")
    }
}
