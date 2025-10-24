use std::sync::Mutex;

use super::ClipboardTrait;
use anyhow::Result;
use arboard::SetExtLinux;

// Only used for autotype on Linux
// Keep a global clipboard instance alive to avoid losing
// clipboard content when not using wait().
// See https://github.com/1Password/arboard#clipboard-ownership
static CLIPBOARD: Mutex<Option<arboard::Clipboard>> = Mutex::new(None);

pub struct Clipboard {}

impl ClipboardTrait for Clipboard {
    fn read() -> Result<String, anyhow::Error> {
        let mut clipboard = arboard::Clipboard::new()?;
        clipboard.get_text().map_err(|e| e.into())
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

    // Only used for autotype on Linux, avoid deadlock from clipboard.set().wait()
    // wait() does not work with autotype which involves multiple copy paste
    fn write_linux_without_wait(text: &str, sensitive: bool) -> Result<(), anyhow::Error> {
        let mut guard = CLIPBOARD.lock().unwrap();
        let clipboard = guard.get_or_insert_with(|| arboard::Clipboard::new().unwrap());

        let set = if sensitive {
            clipboard.set().exclude_from_history()
        } else {
            clipboard.set()
        };

        set.text(text)?;
        Ok(())
    }
}
