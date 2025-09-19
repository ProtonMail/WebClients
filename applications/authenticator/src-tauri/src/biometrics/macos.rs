use block2::RcBlock;
use objc2::rc::Retained;
use objc2_foundation::{NSError, NSString};
use objc2_local_authentication::{LAContext, LAError, LAPolicy};
use std::mem::MaybeUninit;
use std::sync::mpsc as channel_impl;

pub struct Biometrics {
    ctx: Retained<LAContext>,
}

const POLICY: LAPolicy = LAPolicy::DeviceOwnerAuthentication;

impl super::BiometricsTrait for Biometrics {
    fn new(_: tauri::AppHandle) -> Self {
        Self {
            ctx: unsafe { LAContext::new() },
        }
    }

    fn can_check_presence(&self) -> Result<bool, isize> {
        let result = unsafe { self.ctx.canEvaluatePolicy_error(POLICY) };

        result.map(|_| true).map_err(|err| err.code())
    }

    // Uses 0 for channel receive errors to distinguish from negative LAError codes
    fn check_presence(&self, reason: &str) -> Result<(), isize> {
        let (tx, rx) = channel_impl::channel();
        let unsafe_tx = MaybeUninit::new(tx);

        let block = RcBlock::new(move |is_success, error: *mut NSError| {
            // SAFETY: The callback is only executed once.
            let tx = unsafe { unsafe_tx.assume_init_read() };
            let _ = if bool::from(is_success) {
                tx.send(Ok(()))
            } else {
                let code = unsafe { &*error }.code();
                let la_error = LAError(code);
                tx.send(Err(la_error))
            };
        })
        .copy();

        unsafe {
            self.ctx.evaluatePolicy_localizedReason_reply(
                POLICY,
                &NSString::from_str(reason),
                &block,
            )
        };

        rx.recv().map_err(|_| 0_isize)?.map_err(|err| err.0)
    }
}
