use super::ClipboardTrait;
use anyhow::Result;
pub struct Clipboard {}

impl ClipboardTrait for Clipboard {
    fn read() -> Result<String, anyhow::Error> {
        let mut clipboard = arboard::Clipboard::new()?;
        clipboard.get_text().map_err(|e| e.into())
    }

    fn write(text: &str, _: bool) -> Result<(), anyhow::Error> {
        let mut clipboard = arboard::Clipboard::new()?;
        let set = clipboard.set();
        set.text(text).map_err(|e| e.into())
    }
}
