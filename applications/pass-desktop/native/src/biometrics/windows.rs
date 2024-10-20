use anyhow::{anyhow, ensure, Result};
use base64::{engine::general_purpose::STANDARD as base64_engine, Engine};
use rand::RngCore;
use sha2::{Digest, Sha256};
use widestring::U16CString;
use windows::{
    core::{factory, h, Array, HSTRING, PCWSTR, PWSTR},
    Foundation::IAsyncOperation,
    Security::{
        Credentials::{
            KeyCredentialCreationOption, KeyCredentialManager, KeyCredentialStatus,
            UI::{UserConsentVerificationResult, UserConsentVerifier, UserConsentVerifierAvailability},
        },
        Cryptography::CryptographicBuffer,
    },
    Win32::{
        Foundation::{FILETIME, HWND},
        Security::Credentials::{
            CredDeleteW, CredReadW, CredWriteW, CREDENTIALW, CRED_FLAGS, CRED_PERSIST_ENTERPRISE, CRED_TYPE_GENERIC,
        },
        System::WinRT::IUserConsentVerifierInterop,
    },
};

pub struct Biometrics {}

fn random_challenge() -> [u8; 16] {
    let mut challenge = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut challenge);
    challenge
}

impl super::BiometricsTrait for Biometrics {
    fn can_check_presence() -> Result<bool> {
        let available = UserConsentVerifier::CheckAvailabilityAsync()?.get()?;
        match available {
            UserConsentVerifierAvailability::Available => Ok(true),
            UserConsentVerifierAvailability::DeviceBusy => Ok(true),
            _ => Ok(false),
        }
    }

    fn get_decryption_key(challenge_b64: Option<&str>) -> Result<[String; 2]> {
        static KEY_NAME: &HSTRING = h!("ProtonPass");

        let challenge: [u8; 16] = match challenge_b64 {
            Some(str) => base64_engine
                .decode(str)?
                .try_into()
                .map_err(|_e| anyhow!("Invalid challenge"))?,
            None => random_challenge(),
        };

        let open_result =
            KeyCredentialManager::RequestCreateAsync(KEY_NAME, KeyCredentialCreationOption::FailIfExists)?.get()?;

        let retreive_result = match open_result.Status()? {
            KeyCredentialStatus::CredentialAlreadyExists => KeyCredentialManager::OpenAsync(KEY_NAME)?.get()?,
            KeyCredentialStatus::Success => open_result,
            _ => return Err(anyhow!("Failed to create key credential")),
        };

        let credential = retreive_result.Credential()?;
        let challenge_buffer = CryptographicBuffer::CreateFromByteArray(&challenge)?;
        let signature_result = credential.RequestSignAsync(&challenge_buffer)?.get()?;
        ensure!(
            signature_result.Status()? == KeyCredentialStatus::Success,
            "Failed to sign data"
        );

        let signature_buffer = signature_result.Result()?;
        let mut signature_value = Array::<u8>::with_len(signature_buffer.Length()? as usize);
        CryptographicBuffer::CopyToByteArray(&signature_buffer, &mut signature_value)?;

        let key = Sha256::digest(&*signature_value);
        let key_b64 = base64_engine.encode(key);
        let iv_b64 = base64_engine.encode(challenge);
        Ok([key_b64, iv_b64])
    }

    fn check_presence(handle: Vec<u8>, reason: String) -> Result<bool> {
        let h = isize::from_le_bytes(handle.clone().try_into().unwrap());
        let window = HWND(h);

        let interop = factory::<UserConsentVerifier, IUserConsentVerifierInterop>()?;
        let operation: IAsyncOperation<UserConsentVerificationResult> =
            unsafe { interop.RequestVerificationForWindowAsync(window, &HSTRING::from(reason))? };
        let result = operation.get()?;

        match result {
            UserConsentVerificationResult::Verified => Ok(true),
            _ => Ok(false),
        }
    }

    fn get_secret(key: String) -> Result<Vec<u8>> {
        let target_name = U16CString::from_str(target_name(&key))?;

        let mut credential: *mut CREDENTIALW = std::ptr::null_mut();
        let credential_ptr = &mut credential;

        let result = unsafe { CredReadW(PCWSTR(target_name.as_ptr()), CRED_TYPE_GENERIC, 0, credential_ptr) };

        ensure!(result.is_ok(), result.unwrap_err().to_string());

        let secret_bytes = unsafe {
            std::slice::from_raw_parts(
                (*credential).CredentialBlob as *const u8,
                (*credential).CredentialBlobSize as usize,
            )
            .to_vec()
        };

        Ok(secret_bytes)
    }

    fn set_secret(key: String, data: Vec<u8>) -> Result<()> {
        let _ = Self::delete_secret(key.clone());
        let mut target_name = U16CString::from_str(target_name(&key))?;
        let mut user_name = U16CString::from_str(key)?;

        let last_written = FILETIME {
            dwLowDateTime: 0,
            dwHighDateTime: 0,
        };

        let credential_len = data.len() as u32;

        let credential = CREDENTIALW {
            Flags: CRED_FLAGS(0),
            Type: CRED_TYPE_GENERIC,
            TargetName: PWSTR(target_name.as_mut_ptr()),
            Comment: PWSTR::null(),
            LastWritten: last_written,
            CredentialBlobSize: credential_len,
            CredentialBlob: data.as_ptr() as *mut u8,
            Persist: CRED_PERSIST_ENTERPRISE,
            AttributeCount: 0,
            Attributes: std::ptr::null_mut(),
            TargetAlias: PWSTR::null(),
            UserName: PWSTR(user_name.as_mut_ptr()),
        };

        unsafe { CredWriteW(&credential, 0) }?;

        Ok(())
    }

    fn delete_secret(key: String) -> Result<()> {
        let target_name = U16CString::from_str(target_name(&key))?;

        unsafe { CredDeleteW(PCWSTR(target_name.as_ptr()), CRED_TYPE_GENERIC, 0)? };

        Ok(())
    }
}

fn target_name(key: &str) -> String {
    format!("ProtonPass/{}", key)
}
