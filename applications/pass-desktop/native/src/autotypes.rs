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

    pub fn paste(&mut self) -> Result<(), Error> {
        #[cfg(target_os = "macos")]
        let modifier = Key::Meta;
        #[cfg(not(target_os = "macos"))]
        let modifier = Key::Control;

        self.enigo.key(modifier, Press)?;
        self.enigo.key(Key::Unicode('v'), Click)?;
        self.enigo.key(modifier, Release)?;
        Ok(())
    }
}
