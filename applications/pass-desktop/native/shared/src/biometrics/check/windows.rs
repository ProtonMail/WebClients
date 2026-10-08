//! Windows Hello presence check.
//!
//! The prompt runs on a dedicated thread that owns a hidden window and pumps its message
//! queue. `RequestVerificationForWindowAsync` parents the credential dialog to that
//! window, which is what lets the dialog take the keyboard when the caller is a
//! background process such as the native messaging host: a prompt parented to
//! `GetDesktopWindow()` renders on top but never receives input, and the user cannot type
//! their PIN (IDTEAM-5762).
//!
//! Owning a window is necessary but not sufficient. A process that never held the
//! foreground has no right to take it, so `SetForegroundWindow` is refused depending on
//! transient system state — which is how the same prompt can open focused, unfocused or
//! behind the browser from one attempt to the next. The owner window therefore borrows the
//! input queue of the current foreground thread (`AttachThreadInput`) for the duration of
//! the activation calls, and the dialog is only requested once the window reports itself as
//! foreground. No synthetic key events are involved: injecting `VK_MENU` around
//! `SetForegroundWindow` is the other known workaround and it leaves Alt logically held
//! system-wide when the key-up is lost.

use std::sync::mpsc;
use std::sync::Once;
use std::time::{Duration, Instant};

use anyhow::{anyhow, bail, Result};
use windows::core::{factory, w, RuntimeType, HSTRING, PCWSTR};
use windows::Foundation::{AsyncOperationCompletedHandler, IAsyncOperation};
use windows::Security::Credentials::UI::{
    UserConsentVerificationResult, UserConsentVerifier, UserConsentVerifierAvailability,
};
use windows::Win32::Foundation::{BOOL, COLORREF, HWND, LPARAM, LRESULT, RPC_E_CHANGED_MODE, WPARAM};
use windows::Win32::System::Com::{CoInitializeEx, CoUninitialize, COINIT_APARTMENTTHREADED};
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::System::Threading::{AttachThreadInput, GetCurrentThreadId};
use windows::Win32::System::WinRT::IUserConsentVerifierInterop;
use windows::Win32::UI::WindowsAndMessaging::{
    BringWindowToTop, CreateWindowExW, DefWindowProcW, DestroyWindow, DispatchMessageW, GetForegroundWindow,
    GetMessageW, GetSystemMetrics, GetWindowThreadProcessId, PeekMessageW, PostMessageW, RegisterClassW,
    SetForegroundWindow, SetLayeredWindowAttributes, SetWindowPos, ShowWindow, TranslateMessage, HMENU, HWND_TOPMOST,
    LWA_ALPHA, MSG, PM_REMOVE, SM_CXSCREEN, SM_CYSCREEN, SWP_NOMOVE, SWP_NOSIZE, SWP_SHOWWINDOW, SW_SHOWNORMAL, WM_APP,
    WNDCLASSW, WS_EX_LAYERED, WS_EX_TOOLWINDOW, WS_EX_TOPMOST, WS_POPUP,
};

const WINDOW_CLASS: PCWSTR = w!("ProtonPassBiometricPromptOwner");
const WM_OPERATION_COMPLETED: u32 = WM_APP;
const FOREGROUND_TIMEOUT: Duration = Duration::from_millis(1500);
const FOREGROUND_RETRY_DELAY: Duration = Duration::from_millis(16);

pub fn generic_check_presence(reason: String) -> Result<()> {
    let (sender, receiver) = mpsc::channel();

    // The prompt blocks until the user answers and needs an apartment and a message loop
    // of its own, so it never runs on the caller's thread.
    std::thread::Builder::new()
        .name("proton-pass-biometrics".into())
        .spawn(move || {
            let _ = sender.send(prompt_on_owned_window(&reason));
        })
        .map_err(|e| anyhow!("Authentication thread failure {e}"))?;

    receiver
        .recv()
        .map_err(|e| anyhow!("Authentication result never delivered {e}"))?
}

fn prompt_on_owned_window(reason: &str) -> Result<()> {
    let _apartment = Apartment::new_single_threaded();
    let window = OwnerWindow::new()?;

    // Skipping the availability check makes the verification request hang instead of
    // failing when Hello is not usable.
    let availability = window.pump_until_complete(UserConsentVerifier::CheckAvailabilityAsync()?)?;
    if availability != UserConsentVerifierAvailability::Available {
        bail!("Authentication unavailable {availability:?}");
    }

    if !window.take_foreground() {
        log::warn!("Authentication window was refused the foreground, the prompt may open unfocused");
    }

    let interop = factory::<UserConsentVerifier, IUserConsentVerifierInterop>()?;
    let verification = unsafe { interop.RequestVerificationForWindowAsync(window.handle, &HSTRING::from(reason))? };

    convert(window.pump_until_complete(verification)?)
}

pub(crate) fn convert(result: UserConsentVerificationResult) -> Result<()> {
    match result {
        UserConsentVerificationResult::Verified => Ok(()),
        UserConsentVerificationResult::DeviceBusy => bail!("Authentication device is busy."),
        UserConsentVerificationResult::DeviceNotPresent => bail!("No authentication device found."),
        UserConsentVerificationResult::DisabledByPolicy => bail!("Authentication device is disabled by policy."),
        UserConsentVerificationResult::NotConfiguredForUser => bail!("No authentication device configured."),
        UserConsentVerificationResult::Canceled => bail!("Authentication cancelled."),
        UserConsentVerificationResult::RetriesExhausted => bail!("There have been too many failed attempts."),
        _ => bail!("Biometric authentication failed."),
    }
}

/// A single-threaded COM apartment for the calling thread, released on drop unless the
/// thread already belonged to another one.
struct Apartment {
    owned: bool,
}

impl Apartment {
    fn new_single_threaded() -> Self {
        let result = unsafe { CoInitializeEx(None, COINIT_APARTMENTTHREADED) };
        Self {
            owned: result != RPC_E_CHANGED_MODE,
        }
    }
}

impl Drop for Apartment {
    fn drop(&mut self) {
        if self.owned {
            unsafe { CoUninitialize() };
        }
    }
}

/// A near-transparent, off-taskbar window whose only job is to own the credential dialog.
struct OwnerWindow {
    handle: HWND,
}

impl OwnerWindow {
    fn new() -> Result<Self> {
        let instance = unsafe { GetModuleHandleW(None)? };

        static REGISTER_CLASS: Once = Once::new();
        REGISTER_CLASS.call_once(|| {
            let class = WNDCLASSW {
                lpfnWndProc: Some(window_proc),
                hInstance: instance.into(),
                lpszClassName: WINDOW_CLASS,
                ..Default::default()
            };
            unsafe { RegisterClassW(&class) };
        });

        // Centred on the primary monitor: the credential dialog positions itself against its
        // owner, and a corner window pushes it to the edge of the screen.
        let (x, y) = unsafe { (GetSystemMetrics(SM_CXSCREEN) / 2, GetSystemMetrics(SM_CYSCREEN) / 2) };

        let handle = unsafe {
            CreateWindowExW(
                WS_EX_LAYERED | WS_EX_TOOLWINDOW | WS_EX_TOPMOST,
                WINDOW_CLASS,
                w!("Proton Pass"),
                WS_POPUP,
                x,
                y,
                1,
                1,
                HWND::default(),
                HMENU::default(),
                instance,
                None,
            )
        };

        if handle.0 == 0 {
            bail!("Authentication window creation failed");
        }

        // The lowest alpha that still leaves the window visible to the window manager: a
        // fully transparent layered window is skipped by hit testing and is an unreliable
        // activation target. One pixel at alpha 1 is invisible in practice.
        unsafe { SetLayeredWindowAttributes(handle, COLORREF(0), 1, LWA_ALPHA)? };

        Ok(Self { handle })
    }

    /// Activates the window, retrying until it actually holds the foreground. Activation is
    /// asynchronous, so requesting the dialog right after a single `SetForegroundWindow`
    /// call lets the credential broker inherit a stale input state.
    fn take_foreground(&self) -> bool {
        unsafe { ShowWindow(self.handle, SW_SHOWNORMAL) };

        let deadline = Instant::now() + FOREGROUND_TIMEOUT;
        loop {
            if self.holds_foreground() {
                return true;
            }

            self.request_foreground();
            self.drain_messages();

            if Instant::now() >= deadline {
                return self.holds_foreground();
            }

            std::thread::sleep(FOREGROUND_RETRY_DELAY);
        }
    }

    fn holds_foreground(&self) -> bool {
        unsafe { GetForegroundWindow() == self.handle }
    }

    fn request_foreground(&self) {
        let _input_queue = BorrowedInputQueue::from_foreground_thread();

        unsafe {
            let _ = SetWindowPos(
                self.handle,
                HWND_TOPMOST,
                0,
                0,
                0,
                0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW,
            );
            let _ = BringWindowToTop(self.handle);
            SetForegroundWindow(self.handle);
        }
    }

    fn drain_messages(&self) {
        let mut message = MSG::default();
        while unsafe { PeekMessageW(&mut message, HWND::default(), 0, 0, PM_REMOVE) }.as_bool() {
            unsafe {
                let _ = TranslateMessage(&message);
                DispatchMessageW(&message);
            }
        }
    }

    /// Runs the window's message loop until the operation completes, then returns its
    /// result. The loop is what keeps the owner window responsive while the dialog is up.
    fn pump_until_complete<T>(&self, operation: IAsyncOperation<T>) -> Result<T>
    where
        T: RuntimeType,
    {
        let handle = self.handle.0;
        operation.SetCompleted(&AsyncOperationCompletedHandler::new(move |_, _| unsafe {
            PostMessageW(HWND(handle), WM_OPERATION_COMPLETED, WPARAM(0), LPARAM(0))
        }))?;

        let mut message = MSG::default();
        loop {
            let received = unsafe { GetMessageW(&mut message, HWND::default(), 0, 0) };
            if received.0 <= 0 || message.message == WM_OPERATION_COMPLETED {
                break;
            }

            unsafe {
                let _ = TranslateMessage(&message);
                DispatchMessageW(&message);
            }
        }

        Ok(operation.GetResults()?)
    }
}

impl Drop for OwnerWindow {
    fn drop(&mut self) {
        unsafe {
            let _ = DestroyWindow(self.handle);
        }
    }
}

/// The input queue of the foreground thread, shared with the calling thread while alive.
/// Windows grants activation rights to whoever owns the foreground input queue, which is how
/// a background process gets its window accepted by `SetForegroundWindow`.
struct BorrowedInputQueue {
    lender: Option<u32>,
}

impl BorrowedInputQueue {
    fn from_foreground_thread() -> Self {
        let foreground = unsafe { GetForegroundWindow() };
        if foreground.0 == 0 {
            return Self { lender: None };
        }

        let lender = unsafe { GetWindowThreadProcessId(foreground, None) };
        let borrower = unsafe { GetCurrentThreadId() };
        if lender == 0 || lender == borrower {
            return Self { lender: None };
        }

        let attached = unsafe { AttachThreadInput(borrower, lender, BOOL::from(true)) }.as_bool();

        Self {
            lender: attached.then_some(lender),
        }
    }
}

impl Drop for BorrowedInputQueue {
    fn drop(&mut self) {
        if let Some(lender) = self.lender {
            unsafe { AttachThreadInput(GetCurrentThreadId(), lender, BOOL::from(false)) };
        }
    }
}

extern "system" fn window_proc(window: HWND, message: u32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    unsafe { DefWindowProcW(window, message, wparam, lparam) }
}
