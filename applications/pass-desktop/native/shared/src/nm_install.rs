use native_messaging::{install, Scope};
use std::path::Path;

pub fn nm_install(binary_path: &String) -> std::io::Result<()> {
    install(
        // Host name
        "me.proton.pass.nm",
        // Host description
        "Proton Pass host for native messaging with the desktop app",
        // Binary absolute path
        Path::new(binary_path),
        // Chrome allowed_origins
        &[
            "chrome-extension://ghmbeldphafepmbegfdlkpapadhbakde/".to_string(), // Chrome web store
            "chrome-extension://hlaiofkbmjenhgeinjlmkafaipackfjh/".to_string(), // Chrome web store beta
            "chrome-extension://gcllgfdnfnllodcaambdaknbipemelie/".to_string(), // Edge Add-ons
        ],
        // Firefox-family allow-list:
        &[
            "78272b6fa58f4a1abaac99321d503a20@proton.me".to_string(), // Firefox ID
        ],
        // Browsers list
        &["chrome", "firefox", "edge"],
        // Install scope
        Scope::User,
    )
}
