use super::ClipboardTrait;
use anyhow::Result;
pub struct Clipboard {}

impl ClipboardTrait<arboard::Clipboard> for Clipboard {
    fn read() -> Result<String, anyhow::Error> {
        let mut clipboard = arboard::Clipboard::new()?;
        clipboard.get_text().map_err(|e| e.into())
    }

    fn write(text: &str, _: bool, _: bool) -> Result<(), anyhow::Error> {
        let mut clipboard = arboard::Clipboard::new()?;
        clipboard.set().text(text).map_err(|e| e.into())
    }

    fn chain(func: impl FnOnce(&mut arboard::Clipboard) -> Result<(), anyhow::Error>) -> Result<(), anyhow::Error> {
        let mut clipboard = arboard::Clipboard::new()?;

        func(&mut clipboard)
    }
}
