use super::ClipboardTrait;
use anyhow::Result;
use arboard::SetExtWindows;

pub struct Clipboard {}

impl ClipboardTrait<arboard::Clipboard> for Clipboard {
    fn read() -> Result<String, anyhow::Error> {
        let mut clipboard = arboard::Clipboard::new()?;
        clipboard.get_text().map_err(|e| e.into())
    }

    fn write(text: &str, sensitive: bool, _: bool) -> Result<(), anyhow::Error> {
        let mut clipboard = arboard::Clipboard::new()?;

        let set = if sensitive {
            clipboard.set().exclude_from_cloud().exclude_from_history()
        } else {
            clipboard.set()
        };

        set.text(text).map_err(|e| e.into())
    }

    fn chain(func: impl FnOnce(&mut arboard::Clipboard) -> Result<(), anyhow::Error>) -> Result<(), anyhow::Error> {
        let mut clipboard =
            arboard::Clipboard::new().map_err(|e| anyhow::anyhow!("Failed to create clipboard: {}", e))?;

        func(&mut clipboard)
    }
}
