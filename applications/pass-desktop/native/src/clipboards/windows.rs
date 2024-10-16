use anyhow::Result;
use arboard::SetExtWindows;

pub struct Clipboard {}

impl super::ClipboardTrait for Clipboard {
    fn read() -> Result<String, anyhow::Error> {
        let mut clipboard = arboard::Clipboard::new()?;
        clipboard.get_text().map_err(|e| e.into())
    }

    fn write(text: &str, sensitive: bool) -> Result<(), anyhow::Error> {
        let mut clipboard = arboard::Clipboard::new()?;

        let set = if sensitive {
            clipboard.set().exclude_from_cloud().exclude_from_history()
        } else {
            clipboard.set()
        };

        set.text(text).map_err(|e| e.into())
    }
}
