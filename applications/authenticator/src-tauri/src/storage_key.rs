use crate::crypto::generate_encryption_key;
use base64::{engine::general_purpose, Engine as _};
use keyring::{Entry, Error};
use serde::Serialize;
use specta::Type;

/// Mirrors the core `keyring::Error` enum with stripped down error messages.
/// This allows handling errors gracefully in JS via specta bindings.
#[derive(Serialize, Type)]
#[serde(tag = "type", content = "message")]
pub enum KeyringError {
    PlatformFailure(String),
    NoStorageAccess(String),
    NoEntry(String),
    BadEncoding(String),
    TooLong(String),
    Invalid(String),
    Ambiguous(String),
    Unknown(String),
}

impl From<Error> for KeyringError {
    fn from(err: Error) -> Self {
        match err {
            Error::Ambiguous(_) => KeyringError::Ambiguous(err.to_string()),
            Error::PlatformFailure(_) => KeyringError::PlatformFailure(err.to_string()),
            Error::NoStorageAccess(_) => KeyringError::NoStorageAccess(err.to_string()),
            Error::NoEntry => KeyringError::NoEntry(err.to_string()),
            Error::BadEncoding(_) => KeyringError::BadEncoding(err.to_string()),
            Error::TooLong(_, _) => KeyringError::TooLong(err.to_string()),
            Error::Invalid(_, _) => KeyringError::Invalid(err.to_string()),
            _ => KeyringError::Unknown(String::from("Unknown keyring error")),
        }
    }
}

const SERVICE_NAME: &str = if cfg!(debug_assertions) {
    "com.proton.authenticator.dev"
} else {
    "com.proton.authenticator"
};

fn secret_to_b64(secret: &Vec<u8>) -> String {
    general_purpose::STANDARD.encode(secret)
}

/// Retrieves a local key by `key_id`. Consumers should parse the
/// `KeyringError` enum in case of errors to decide how to proceed.
#[tauri::command]
#[specta::specta]
pub fn get_storage_key(key_id: &str) -> Result<String, KeyringError> {
    let b64 = Entry::new(SERVICE_NAME, key_id)
        .and_then(|entry| entry.get_secret())
        .map(|secret| secret_to_b64(&secret))
        .map_err(KeyringError::from)?;

    Ok(b64)
}

/// Generates a local key and attempts to save it to the OS's keyring.
/// If the key already exists, resolves it.
#[tauri::command]
#[specta::specta]
pub fn generate_storage_key(key_id: &str) -> Result<String, KeyringError> {
    let entry = Entry::new(SERVICE_NAME, key_id).map_err(KeyringError::from)?;

    if let Ok(secret) = entry.get_secret() {
        return Ok(secret_to_b64(&secret));
    }

    let secret = generate_encryption_key();
    entry.set_secret(&secret).map_err(KeyringError::from)?;
    Ok(secret_to_b64(&secret))
}

#[tauri::command]
#[specta::specta]
pub fn remove_storage_key(key_id: &str) -> Result<(), KeyringError> {
    Entry::new(SERVICE_NAME, key_id)
        .and_then(|entry| entry.delete_credential())
        .map_err(KeyringError::from)
}
