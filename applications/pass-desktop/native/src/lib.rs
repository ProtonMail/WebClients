mod autotypes;
mod biometrics;
mod clipboards;

#[macro_use]
extern crate napi_derive;

use crate::autotypes::Autotype as AutotypeCore;

#[napi]
pub mod biometric {
    use napi::bindgen_prelude::{Buffer, Uint8Array};

    use super::biometrics::*;

    #[napi]
    pub async fn can_check_presence() -> napi::Result<bool> {
        Biometrics::can_check_presence().map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    #[napi]
    pub async fn check_presence(handle: Buffer, reason: String) -> napi::Result<()> {
        Biometrics::check_presence(handle.into(), reason).map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    #[napi]
    pub async fn get_secret(key: String) -> napi::Result<Uint8Array> {
        let vec = Biometrics::get_secret(key).map_err(|e| napi::Error::from_reason(e.to_string()))?;
        Ok(Uint8Array::new(vec))
    }

    #[napi]
    pub async fn set_secret(key: String, secret: Uint8Array) -> napi::Result<()> {
        Biometrics::set_secret(key, secret.to_vec()).map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    #[napi]
    pub async fn delete_secret(key: String) -> napi::Result<()> {
        Biometrics::delete_secret(key).map_err(|e| napi::Error::from_reason(e.to_string()))
    }
}

#[napi]
pub mod clipboard {
    use super::clipboards::*;

    #[napi]
    pub async fn write_text(text: String, sensitive: bool) -> napi::Result<()> {
        Clipboard::write(&text, sensitive).map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    #[napi]
    pub async fn read() -> napi::Result<String> {
        Clipboard::read().map_err(|e| napi::Error::from_reason(e.to_string()))
    }
}

#[napi]
pub struct Autotype {
    autotype: AutotypeCore,
}

#[napi]
// If you have the rust-analyzer error "Did not find struct `Autotype` parsed before expand #[napi] for impl"
// then add this line to your settings.json:
// "rust-analyzer.procMacro.ignored": { "napi-derive": ["napi"] }
// (See https://github.com/napi-rs/napi-rs/issues/2390)
impl Autotype {
    #[napi(constructor)]
    pub fn new() -> napi::Result<Self> {
        let autotype = AutotypeCore::new().map_err(|e| napi::Error::from_reason(e.to_string()))?;
        Ok(Autotype { autotype })
    }

    #[napi]
    pub fn text(&mut self, text: String) -> napi::Result<()> {
        self.autotype
            .text(&text)
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    #[napi]
    pub fn tab(&mut self) -> napi::Result<()> {
        self.autotype.tab().map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    #[napi]
    pub fn enter(&mut self) -> napi::Result<()> {
        self.autotype
            .enter()
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }
}
