//! Touch ID presence check through LocalAuthentication.
//!
//! `DeviceOwnerAuthentication` is biometrics with a passcode fallback, which is what the
//! lock UI promises.

use std::sync::mpsc;

use anyhow::{anyhow, ensure, Result};
use block2::RcBlock;
use objc2_foundation::{NSError, NSString};
use objc2_local_authentication::{LAContext, LAPolicy};

const POLICY: LAPolicy = LAPolicy::DeviceOwnerAuthentication;

pub fn generic_check_presence(reason: String) -> Result<()> {
    // An empty reason makes `evaluatePolicy` raise `NSInvalidArgumentException`, which
    // aborts the process.
    ensure!(!reason.is_empty(), "Authentication reason is empty");

    // An `LAContext` is single use: on a reused one, a past success skips the prompt.
    let context = unsafe { LAContext::new() };
    unsafe { context.canEvaluatePolicy_error(POLICY) }.map_err(|e| anyhow!("Authentication unavailable {e}"))?;

    let (sender, receiver) = mpsc::channel();
    // The reply runs on a framework queue, so the context has to outlive this call.
    let context_keepalive = context.clone();
    let reply = RcBlock::new(move |authenticated, error: *mut NSError| {
        let _context = &context_keepalive;
        let _ = sender.send(evaluation_result(bool::from(authenticated), error));
    });

    unsafe { context.evaluatePolicy_localizedReason_reply(POLICY, &NSString::from_str(&reason), &reply) };

    receiver
        .recv()
        .map_err(|e| anyhow!("Authentication result never delivered {e}"))?
}

fn evaluation_result(authenticated: bool, error: *mut NSError) -> Result<()> {
    if authenticated {
        return Ok(());
    }

    match unsafe { error.as_ref() } {
        Some(error) => Err(anyhow!("Authentication failure {}", error.code())),
        None => Err(anyhow!("Authentication failure")),
    }
}
