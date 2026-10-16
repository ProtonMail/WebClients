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
