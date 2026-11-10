use std::fmt;

use anyhow::Result;

/// The user dismissed the prompt. Callers tell it apart from a failed authentication with
/// `anyhow::Error::is`: a cancel is not a failed attempt.
#[derive(Debug)]
pub struct PresenceCheckCancelled;

impl fmt::Display for PresenceCheckCancelled {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Authentication cancelled.")
    }
}

impl std::error::Error for PresenceCheckCancelled {}

/// Splits a presence check result for the JS bridge: `true` verified, `false` cancelled by
/// the user, an error for every other failure. The error code is language independent,
/// unlike the message of an OS prompt.
pub fn presence_outcome(result: Result<()>) -> Result<bool> {
    match result {
        Ok(()) => Ok(true),
        Err(error) if error.is::<PresenceCheckCancelled>() => Ok(false),
        Err(error) => Err(error),
    }
}

/// Shared presence check. Declared here rather than inside each platform module so the
/// macOS and Windows implementations sit side by side.
#[cfg(any(target_os = "macos", target_os = "windows"))]
mod check;

#[cfg_attr(target_os = "windows", path = "windows.rs")]
#[cfg_attr(target_os = "macos", path = "macos.rs")]
#[cfg_attr(target_os = "linux", path = "linux.rs")]
mod biometrics_platform;

pub trait BiometricsTrait {
    fn can_check_presence() -> Result<bool>;
    fn check_presence(handle: Vec<u8>, reason: String) -> Result<()>;
    fn new_check_presence(reason: String) -> Result<()>;
    fn get_secret(key: String) -> Result<Vec<u8>>;
    fn set_secret(key: String, data: Vec<u8>) -> Result<()>;
    fn delete_secret(key: String) -> Result<()>;
}

pub use biometrics_platform::*;

#[cfg(test)]
mod tests {
    use anyhow::anyhow;

    use super::*;

    #[test]
    fn verified_check_is_true() {
        assert!(presence_outcome(Ok(())).unwrap());
    }

    #[test]
    fn cancelled_check_is_false() {
        assert!(!presence_outcome(Err(PresenceCheckCancelled.into())).unwrap());
    }

    #[test]
    fn failed_check_keeps_its_message() {
        let error = presence_outcome(Err(anyhow!("There have been too many failed attempts."))).unwrap_err();
        assert_eq!(error.to_string(), "There have been too many failed attempts.");
    }
}
