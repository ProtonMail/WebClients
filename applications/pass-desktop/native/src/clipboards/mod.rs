use anyhow::Result;

#[cfg_attr(target_os = "windows", path = "windows.rs")]
#[cfg_attr(target_os = "macos", path = "macos.rs")]
#[cfg_attr(target_os = "linux", path = "linux.rs")]
mod clipboard_platform;

pub trait ClipboardTrait {
    /// The `immediate` flag is only used for linux targets where
    /// we need more fine-grained control over the clipboard's lifecycle
    fn write(text: &str, sensitive: bool, immediate: bool) -> Result<(), anyhow::Error>;
    fn read() -> Result<String, anyhow::Error>;
}

pub use clipboard_platform::*;
