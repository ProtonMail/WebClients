use anyhow::{anyhow, Context, Result};
use robius_authentication::{AndroidText, BiometricStrength, Policy, PolicyBuilder, Text, WindowsText};

pub fn generic_check_presence(reason: String) -> Result<()> {
    let policy: Policy = PolicyBuilder::new()
        .biometrics(Some(BiometricStrength::Strong))
        .password(true)
        .watch(true)
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

    robius_authentication::Context::new(())
        .blocking_authenticate(text, &policy)
        .map_err(|e| anyhow!("Authentication failure {:?}", e))
}
