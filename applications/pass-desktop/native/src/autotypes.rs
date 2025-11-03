#[cfg(target_os = "linux")]
use crate::clipboards::{Clipboard, ClipboardTrait};
use anyhow::{Error, Result};
#[cfg(target_os = "linux")]
use arboard::SetExtLinux;
use enigo::{
    Direction::{Click, Press, Release},
    Enigo, Key, Keyboard, Settings,
};
#[cfg(target_os = "linux")]
use std::thread;
#[cfg(target_os = "linux")]
use std::time::Duration;

pub struct Autotype {
    enigo: Enigo,
}

impl Autotype {
    pub fn new() -> Result<Self, Error> {
        Ok(Self {
            enigo: Enigo::new(&Settings::default())?,
        })
    }

    #[cfg_attr(target_os = "linux", allow(dead_code))]
    fn text(&mut self, text: &str) -> Result<(), Error> {
        self.enigo.text(text)?;
        Ok(())
    }

    fn tab(&mut self) -> Result<(), Error> {
        self.enigo.key(Key::Tab, Click)?;
        Ok(())
    }

    fn enter(&mut self) -> Result<(), Error> {
        self.enigo.key(Key::Return, Click)?;
        Ok(())
    }

    #[cfg_attr(not(target_os = "linux"), allow(dead_code))]
    fn paste(&mut self) -> Result<(), Error> {
        #[cfg(target_os = "macos")]
        let modifier = Key::Meta;
        #[cfg(not(target_os = "macos"))]
        let modifier = Key::Control;

        self.enigo.key(modifier, Press)?;
        self.enigo.key(Key::Unicode('v'), Click)?;
        self.enigo.key(modifier, Release)?;
        Ok(())
    }

    fn perform_separator(&mut self, idx: usize, length: usize, enter_at_the_end: bool) -> Result<(), Error> {
        if idx < length - 1 {
            self.tab()?;
        } else if enter_at_the_end {
            self.enter()?;
        }
        Ok(())
    }

    pub fn perform_autotype(&mut self, fields: Vec<String>, enter_at_the_end: Option<bool>) -> Result<(), Error> {
        let enter_at_the_end = enter_at_the_end.unwrap_or(false);
        let fields_len = fields.len();

        /* On Linux, enigo with libei feature (needed to support Wayland)
        cannot type special characters with enigo.text(),
        so we copy the field value in clipboard and paste it instead.
        Related issue: https://github.com/enigo-rs/enigo/issues/404. */
        #[cfg(target_os = "linux")]
        {
            Clipboard::chain(|clipboard| {
                // Save current clipboard value to restore it after autotype is done
                let initial_clipboard_value = clipboard.get_text()?;

                for (idx, field) in fields.iter().enumerate() {
                    clipboard.set().exclude_from_history().text(field)?;
                    self.paste()?;
                    // Waiting to avoid race conditions between clipboard and pasting on slow PC
                    thread::sleep(Duration::from_millis(100));
                    self.perform_separator(idx, fields_len, enter_at_the_end)?;
                }

                /* Restore clipboard in background thread to avoid blocking.
                wait() is needed to keep the value in clipboard after the app quits
                (see https://github.com/1Password/arboard#clipboard-ownership),
                but it blocks the app until another process uses the clipboard */
                std::thread::spawn(move || -> Result<()> {
                    let mut clipboard = arboard::Clipboard::new()?;
                    clipboard
                        .set()
                        .exclude_from_history()
                        .wait()
                        .text(initial_clipboard_value)?;
                    Ok(())
                });

                Ok(())
            })?;
        }

        #[cfg(not(target_os = "linux"))]
        {
            for (idx, field) in fields.iter().enumerate() {
                self.text(field)?;
                self.perform_separator(idx, fields_len, enter_at_the_end)?;
            }
        }

        Ok(())
    }
}
