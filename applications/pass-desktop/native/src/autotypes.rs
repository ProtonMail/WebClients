use anyhow::{Error, Result};
use enigo::{Direction::Click, Enigo, Key, Keyboard, Settings};

pub struct Autotype {
    enigo: Enigo,
}

impl Autotype {
    pub fn new() -> Result<Self, Error> {
        Ok(Self {
            enigo: Enigo::new(&Settings::default())?,
        })
    }

    pub fn text(&mut self, text: &str) -> Result<(), Error> {
        self.enigo.text(text).map_err(|e| e.into())
    }

    pub fn tab(&mut self) -> Result<(), Error> {
        self.enigo.key(Key::Tab, Click).map_err(|e| e.into())
    }

    pub fn enter(&mut self) -> Result<(), Error> {
        self.enigo.key(Key::Return, Click).map_err(|e| e.into())
    }
}
