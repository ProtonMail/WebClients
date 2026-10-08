use native_messaging::{install, Scope};
use std::path::Path;

pub fn nm_install(chromium_binary_path: &String, firefox_binary_path: &String) -> std::io::Result<()> {
    let host_name = "me.proton.pass.nm";
    let description = "Proton Pass host for native messaging with the desktop app";
    let chrome_allowed_origins = [
        "chrome-extension://ghmbeldphafepmbegfdlkpapadhbakde/".to_string(), // Chrome web store
        "chrome-extension://hlaiofkbmjenhgeinjlmkafaipackfjh/".to_string(), // Chrome web store beta
        "chrome-extension://gcllgfdnfnllodcaambdaknbipemelie/".to_string(), // Edge Add-ons
    ];
    let firefox_allowed_extensions = [
        "78272b6fa58f4a1abaac99321d503a20@proton.me".to_string(), // Firefox ID
    ];

    install(
        host_name,
        description,
        Path::new(chromium_binary_path),
        &chrome_allowed_origins,
        &firefox_allowed_extensions,
        &["chrome", "chromium", "edge", "brave", "vivaldi"],
        Scope::User,
    )?;

    // The two paths are identical except on packaged Windows (MSIX), where they
    // diverge for a single reason: Firefox cannot launch the appExecutionAlias
    // stub that Chromium uses. That stub is a 0-byte APPEXECLINK reparse point,
    // and Firefox's subprocess launcher stats the host path and rejects reparse
    // points before launch, so on Windows it gets a real exe copied out of the
    // package instead. See IDTEAM-5762 for the full findings.
    install(
        host_name,
        description,
        Path::new(firefox_binary_path),
        &chrome_allowed_origins,
        &firefox_allowed_extensions,
        &["firefox", "librewolf"],
        Scope::User,
    )
}
