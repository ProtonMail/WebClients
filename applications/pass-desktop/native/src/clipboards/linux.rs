use super::ClipboardTrait;
use anyhow::Result;
use arboard::SetExtLinux;

pub struct Clipboard {}

impl ClipboardTrait for Clipboard {
    fn read() -> Result<String, anyhow::Error> {
        let mut clipboard = arboard::Clipboard::new()?;
        clipboard.get_text().map_err(|e| e.into())
    }

    fn write(text: &str, sensitive: bool) -> Result<(), anyhow::Error> {
        let mut clipboard = arboard::Clipboard::new()?;
        let set = if sensitive {
            clipboard.set().exclude_from_history().wait()
        } else {
            clipboard.set().wait()
        };
        set.text(text)?;
        Ok(())
    }
}
