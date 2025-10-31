use super::ClipboardTrait;
use anyhow::Result;
use arboard::SetExtLinux;

pub struct Clipboard {}

impl ClipboardTrait<arboard::Clipboard> for Clipboard {
    fn read() -> Result<String, anyhow::Error> {
        arboard::Clipboard::new()?
            .get_text()
            .map_err(|e| anyhow::anyhow!("Clipboard read error: {}", e))
    }

    fn write(text: &str, sensitive: bool) -> Result<(), anyhow::Error> {
        let value = text.to_owned();
        std::thread::spawn(move || -> Result<()> {
            let mut clipboard = arboard::Clipboard::new()?;

            let set = if sensitive {
                clipboard.set().exclude_from_history().wait()
            } else {
                clipboard.set().wait()
            };

            set.text(value)?;
            Ok(())
        });
        Ok(())
    }

    fn chain(func: impl FnOnce(&mut arboard::Clipboard) -> Result<(), anyhow::Error>) -> Result<(), anyhow::Error> {
        let mut clipboard = arboard::Clipboard::new()?;
        func(&mut clipboard)
    }
}
