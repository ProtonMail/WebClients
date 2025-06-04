mod autotypes;
mod biometrics;
mod clipboards;

#[macro_use]
extern crate napi_derive;

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
pub mod autotype {
    use super::autotypes::*;

    #[napi]
    pub async fn text(text: String) -> napi::Result<()> {
        Autotype::text(&text).map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    #[napi]
    pub async fn tab() -> napi::Result<()> {
        Autotype::tab().map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    #[napi]
    pub async fn enter() -> napi::Result<()> {
        Autotype::enter().map_err(|e| napi::Error::from_reason(e.to_string()))
    }
}
