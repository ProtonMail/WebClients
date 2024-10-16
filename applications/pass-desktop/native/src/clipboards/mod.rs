use anyhow::Result;

#[cfg_attr(target_os = "windows", path = "windows.rs")]
#[cfg_attr(target_os = "macos", path = "macos.rs")]
#[cfg_attr(target_os = "linux", path = "linux.rs")]
mod clipboards;

pub trait ClipboardTrait {
    fn write(text: &str, sensitive: bool) -> Result<(), anyhow::Error>;
    fn read() -> Result<String, anyhow::Error>;
}

pub use clipboards::*;
