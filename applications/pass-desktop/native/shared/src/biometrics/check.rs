use std::sync::mpsc;

use anyhow::{anyhow, Context, Result};
use robius_authentication::{AndroidText, BiometricStrength, Policy, PolicyBuilder, Text, WindowsText};

pub fn generic_check_presence(reason: String) -> Result<()> {
    let policy: Policy = PolicyBuilder::new()
        .biometrics(Some(BiometricStrength::Strong))
        .password(true)
        .companion(true)
        .build()
        .with_context(|| "Robius policy build with biometric failed")?;

    let text = Text {
        android: AndroidText {
            title: "Not used",
            subtitle: None,
            description: None,
        },
        apple: &reason,
        windows: WindowsText::new("Proton Pass", &reason).with_context(|| "Robius windows test failed")?,
    };

    // `authenticate` only reports that the prompt was raised; the outcome arrives through the
    // callback, which runs on another thread on Windows.
    let (sender, receiver) = mpsc::channel();

    robius_authentication::Context::new(())
        .authenticate(text, &policy, move |result| {
            let _ = sender.send(result);
        })
        .map_err(|e| anyhow!("Authentication prompt failure {:?}", e))?;

    receiver
        .recv()
        .map_err(|e| anyhow!("Authentication result never delivered {:?}", e))?
        .map_err(|e| anyhow!("Authentication failure {:?}", e))
}
