#[cfg(target_os = "linux")]
use crate::clipboards::{Clipboard, ClipboardTrait};
use anyhow::{Error, Result};
use enigo::{
    Direction::{Click, Press, Release},
    Enigo, Key, Keyboard, Settings,
};

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
            // Save current clipboard value to restore it after autotype is done
            let initial_clipboard_value = Clipboard::read()?;

            for (idx, field) in fields.iter().enumerate() {
                Clipboard::write(field, true, true)?;
                self.paste()?;
                self.perform_separator(idx, fields_len, enter_at_the_end)?;
            }

            Clipboard::write(&initial_clipboard_value, true, true)?;
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
