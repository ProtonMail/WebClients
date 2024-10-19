use anyhow::{bail, Result};
use security_framework::passwords::{
    delete_generic_password, get_generic_password, set_generic_password,
};

pub struct Biometrics {}

const SERVICE_NAME: &str = "ProtonPass";

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

    fn get_secret(key: String) -> Result<Vec<u8>> {
        Ok(get_generic_password(SERVICE_NAME, &key)?)
    }

    fn set_secret(key: String, data: Vec<u8>) -> Result<()> {
        Ok(set_generic_password(SERVICE_NAME, &key, &data)?)
    }

    fn delete_secret(key: String) -> Result<()> {
        let res = delete_generic_password(SERVICE_NAME, &key)?;
        Ok(res)
    }
}
