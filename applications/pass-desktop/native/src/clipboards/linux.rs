use std::sync::Mutex;

use super::ClipboardTrait;
use anyhow::Result;
use arboard::SetExtLinux;

struct ClipboardManager {
    instance: Mutex<Option<arboard::Clipboard>>,
}

impl ClipboardManager {
    const fn new() -> Self {
        Self {
            // Allows keeping a global clipboard instance alive to avoid losing
            // clipboard content when not using wait().
            // See https://github.com/1Password/arboard#clipboard-ownership
            instance: Mutex::new(None),
        }
    }

    /// Use the shared global clipboard instance (persists across calls)
    fn with_shared_clipboard<T>(&self, func: impl FnOnce(&mut arboard::Clipboard) -> T) -> Result<T> {
        let mut guard = self
            .instance
            .lock()
            .map_err(|e| anyhow::anyhow!("Clipboard poisoned: {}", e))?;
        let clipboard = guard.get_or_insert_with(|| arboard::Clipboard::new().unwrap());
        Ok(func(clipboard))
    }

    /// Create a temporary clipboard instance (no lock held, suitable for .wait())
    fn with_clipboard<T>(&self, func: impl FnOnce(&mut arboard::Clipboard) -> T) -> Result<T> {
        let mut clipboard =
            arboard::Clipboard::new().map_err(|e| anyhow::anyhow!("Failed to create clipboard: {}", e))?;
        Ok(func(&mut clipboard))
    }

    /// Releases the clipboard mutex so the underlying
    /// instance can be dropped when we're finished
    #[allow(dead_code)]
    fn release(&self) -> Result<()> {
        let mut guard = self
            .instance
            .lock()
            .map_err(|e| anyhow::anyhow!("Clipboard mutex poisoned: {}", e))?;

        guard.take();
        Ok(())
    }
}

static MANAGER: ClipboardManager = ClipboardManager::new();

pub struct Clipboard {}

impl ClipboardTrait for Clipboard {
    fn read() -> Result<String, anyhow::Error> {
        MANAGER.with_clipboard(|clipboard| {
            clipboard
                .get_text()
                .map_err(|e| anyhow::anyhow!("Clipboard read error: {}", e))
        })?
    }

    fn write(text: &str, sensitive: bool, immediate: bool) -> Result<(), anyhow::Error> {
        let writer = |clipboard: &mut arboard::Clipboard| {
            let setter = match (sensitive, immediate) {
                (true, true) => clipboard.set().exclude_from_history(),
                (true, false) => clipboard.set().exclude_from_history().wait(),
                (false, true) => clipboard.set(),
                (false, false) => clipboard.set().wait(),
            };

            setter
                .text(text)
                .map_err(|e| anyhow::anyhow!("Clipboard write error: {}", e))
        };

        if immediate {
            MANAGER.with_shared_clipboard(writer)?
        } else {
            MANAGER.with_clipboard(writer)?
        }
    }
}
