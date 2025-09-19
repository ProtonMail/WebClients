use tauri::Manager;
use windows::{
    core::{factory, HSTRING},
    Security::Credentials::UI::{
        UserConsentVerificationResult, UserConsentVerifier, UserConsentVerifierAvailability,
    },
    Win32::{Foundation::HWND, System::WinRT::IUserConsentVerifierInterop},
};

use windows_future::IAsyncOperation;

pub struct Biometrics {
    handle: HWND,
}

impl super::BiometricsTrait for Biometrics {
    fn new(app: tauri::AppHandle) -> Self {
        let hwnd = app.get_webview_window("main").unwrap().hwnd().unwrap();
        Self { handle: hwnd }
    }

    fn can_check_presence(&self) -> Result<bool, isize> {
        let available = UserConsentVerifier::CheckAvailabilityAsync()
            .map_err(|_| -1_isize)?
            .get()
            .map_err(|_| -1_isize)?;

        match available {
            UserConsentVerifierAvailability::Available => Ok(true),
            UserConsentVerifierAvailability::DeviceBusy => Ok(true),
            _ => Ok(false),
        }
    }

    // Uses negative error code (-1) for API failures to distinguish
    // them from positive Windows verification result codes.
    fn check_presence(&self, reason: &str) -> Result<(), isize> {
        let result = factory::<UserConsentVerifier, IUserConsentVerifierInterop>()
            .and_then(|interop| unsafe {
                interop.RequestVerificationForWindowAsync(self.handle, &HSTRING::from(reason))
            })
            .and_then(|operation: IAsyncOperation<UserConsentVerificationResult>| operation.get())
            .map_err(|_| -1_isize)?;

        match result {
            UserConsentVerificationResult::Verified => Ok(()),
            _ => Err(result.0 as isize),
        }
    }
}
