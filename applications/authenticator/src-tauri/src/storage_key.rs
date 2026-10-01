use crate::crypto::{generate_encryption_key, KEY_LENGTH};
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

fn secret_to_b64(secret: &[u8]) -> String {
    general_purpose::STANDARD.encode(secret)
}

fn get_storage_key_from_entry(entry: &Entry) -> Result<String, KeyringError> {
    let secret = match entry.get_password() {
        Ok(secret)
            if general_purpose::STANDARD
                .decode(&secret)
                .is_ok_and(|decoded| decoded.len() == KEY_LENGTH) =>
        {
            return Ok(secret)
        }
        // Older versions stored the 32-byte key directly through `set_secret`.
        Ok(_) | Err(Error::BadEncoding(_)) => entry.get_secret().map_err(KeyringError::from)?,
        Err(err) => return Err(KeyringError::from(err)),
    };

    if secret.len() != KEY_LENGTH {
        return Err(KeyringError::BadEncoding(format!(
            "Stored key must be {KEY_LENGTH} bytes"
        )));
    }

    store_storage_key(entry, &secret)
}

fn store_storage_key(entry: &Entry, secret: &[u8]) -> Result<String, KeyringError> {
    let b64 = secret_to_b64(secret);
    entry.set_password(&b64).map_err(KeyringError::from)?;
    Ok(b64)
}

fn generate_storage_key_from_entry(entry: &Entry) -> Result<String, KeyringError> {
    match get_storage_key_from_entry(entry) {
        Ok(secret) => Ok(secret),
        Err(KeyringError::NoEntry(_)) => store_storage_key(entry, &generate_encryption_key()),
        Err(err) => Err(err),
    }
}

/// Retrieves a local key by `key_id`. Consumers should parse the
/// `KeyringError` enum in case of errors to decide how to proceed.
#[tauri::command]
#[specta::specta]
pub fn get_storage_key(key_id: &str) -> Result<String, KeyringError> {
    let entry = Entry::new(SERVICE_NAME, key_id).map_err(KeyringError::from)?;
    get_storage_key_from_entry(&entry)
}

/// Generates a local key and attempts to save it to the OS's keyring.
/// If the key already exists, resolves it.
#[tauri::command]
#[specta::specta]
pub fn generate_storage_key(key_id: &str) -> Result<String, KeyringError> {
    let entry = Entry::new(SERVICE_NAME, key_id).map_err(KeyringError::from)?;
    generate_storage_key_from_entry(&entry)
}

#[tauri::command]
#[specta::specta]
pub fn remove_storage_key(key_id: &str) -> Result<(), KeyringError> {
    Entry::new(SERVICE_NAME, key_id)
        .and_then(|entry| entry.delete_credential())
        .map_err(KeyringError::from)
}

#[cfg(test)]
mod tests {
    use super::*;
    use keyring::mock::MockCredential;

    const LEGACY_KEY: [u8; 32] = [0xff; 32];
    const ENCODED_KEY: &str = "//////////////////////////////////////////8=";

    fn mock_entry() -> Entry {
        Entry::new_with_credential(Box::new(MockCredential::default()))
    }

    #[test]
    fn round_trips_storage_key_as_base64_text() {
        let entry = mock_entry();

        let stored = match store_storage_key(&entry, &LEGACY_KEY) {
            Ok(stored) => stored,
            Err(_) => panic!("storage key should be stored"),
        };

        assert_eq!(stored, ENCODED_KEY);
        assert_eq!(entry.get_password().unwrap(), ENCODED_KEY);
        assert!(matches!(
            get_storage_key_from_entry(&entry),
            Ok(key) if key == ENCODED_KEY
        ));
    }

    #[test]
    fn migrates_legacy_binary_key_to_base64_text() {
        let entry = mock_entry();
        entry.set_secret(&LEGACY_KEY).unwrap();

        let key = match get_storage_key_from_entry(&entry) {
            Ok(key) => key,
            Err(_) => panic!("legacy storage key should be migrated"),
        };

        assert_eq!(key, ENCODED_KEY);
        assert_eq!(entry.get_password().unwrap(), ENCODED_KEY);
    }

    #[test]
    fn does_not_replace_key_when_keyring_read_fails() {
        let entry = mock_entry();
        let mock = entry
            .get_credential()
            .downcast_ref::<MockCredential>()
            .unwrap();
        mock.set_error(Error::Invalid(
            "mock storage error".to_owned(),
            "test error".to_owned(),
        ));

        let result = generate_storage_key_from_entry(&entry);

        assert!(matches!(result, Err(KeyringError::Invalid(_))));
        assert!(matches!(entry.get_secret(), Err(Error::NoEntry)));
    }
}
