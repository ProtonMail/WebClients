use anyhow::{Error, Result};
use enigo::{Direction::Click, Enigo, Key, Keyboard, Settings};

pub struct Autotype;

impl Autotype {
    pub fn text(text: &str) -> Result<(), Error> {
        let mut enigo = Enigo::new(&Settings::default())?;
        enigo.text(text).map_err(|e| e.into())
    }

    pub fn tab() -> Result<(), Error> {
        let mut enigo = Enigo::new(&Settings::default())?;
        enigo.key(Key::Tab, Click).map_err(|e| e.into())
    }

    pub fn enter() -> Result<(), Error> {
        let mut enigo = Enigo::new(&Settings::default())?;
        enigo.key(Key::Return, Click).map_err(|e| e.into())
    }
}
