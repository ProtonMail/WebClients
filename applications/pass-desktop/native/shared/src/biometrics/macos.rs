//! Secrets are stored in the login keychain under its default ACL, which binds each item
//! to the code signature of the app that created it. Touch ID is checked separately
//! (`new_check_presence`) before the read.
//!
//! Binding the read itself to Touch ID (`SecAccessControl` on a data-protection keychain
//! item) was evaluated in IDTEAM-6206 and left out. It requires `keychain-access-groups`,
//! a Developer ID provisioning profile, and a migration of existing items. It brings no
//! security gain today: the extension lock secret only guards a UI lock, and the default
//! ACL already prevents silent reads by other apps.
//!
//! Revisit if the secret starts protecting key material, if the keychain prompt shown to
//! the native messaging host becomes a UX problem, or if the Mac App Store build needs
//! native messaging.

use anyhow::{bail, Error, Result};
use objc2_local_authentication::{LAContext, LAPolicy};
use security_framework::passwords::{delete_generic_password, get_generic_password, set_generic_password};

use super::check::generic_check_presence;

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
