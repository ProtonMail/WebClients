#![deny(clippy::all)]

mod biometrics;

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
    pub async fn check_presence(handle: Buffer, reason: String) -> napi::Result<bool> {
        Biometrics::check_presence(handle.into(), reason).map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    #[napi]
    pub async fn get_decryption_key(challenge: Option<&str>) -> napi::Result<Vec<String>> {
        Biometrics::get_decryption_key(challenge)
            .map(|v| v.into())
            .map_err(|e| napi::Error::from_reason(e.to_string()))
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
