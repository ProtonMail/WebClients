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
        self.enigo.text(text)?;
        Ok(())
    }

    pub fn tab(&mut self) -> Result<(), Error> {
        self.enigo.key(Key::Tab, Click)?;
        Ok(())
    }

    pub fn enter(&mut self) -> Result<(), Error> {
        self.enigo.key(Key::Return, Click)?;
        Ok(())
    }
}
