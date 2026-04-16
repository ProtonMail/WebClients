mod check;

use anyhow::{bail, Error, Result};
use check::generic_check_presence;
use objc2_local_authentication::{LAContext, LAPolicy};
use security_framework::passwords::{delete_generic_password, get_generic_password, set_generic_password};

pub struct Biometrics {}

const SERVICE_NAME: &str = "ProtonPass";

impl super::BiometricsTrait for Biometrics {
    fn can_check_presence() -> Result<bool> {
        unsafe {
            LAContext::new()
                .canEvaluatePolicy_error(LAPolicy::DeviceOwnerAuthenticationWithBiometrics)
                .map(|()| true)
                .map_err(Error::msg)
        }
    }

    fn check_presence(_handle: Vec<u8>, _reason: String) -> Result<()> {
        bail!("Not implemented")
    }

    fn new_check_presence(reason: String) -> Result<()> {
        generic_check_presence(reason)
    }

    fn get_secret(key: String) -> Result<Vec<u8>> {
        Ok(get_generic_password(SERVICE_NAME, &key)?)
    }

    fn set_secret(key: String, data: Vec<u8>) -> Result<()> {
        Ok(set_generic_password(SERVICE_NAME, &key, &data)?)
    }

    fn delete_secret(key: String) -> Result<()> {
        Ok(delete_generic_password(SERVICE_NAME, &key)?)
    }
}
