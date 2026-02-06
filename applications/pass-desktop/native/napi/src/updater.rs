use anyhow::{bail, Result};
use windows::{
    core::{HSTRING, PCWSTR},
    Foundation::Uri,
    Management::Deployment::{AddPackageOptions, PackageManager},
    Win32::System::Recovery::{RegisterApplicationRestart, REGISTER_APPLICATION_RESTART_FLAGS},
};

// Register the application to restart after update
// Call this BEFORE calling install_update()
pub fn register_for_restart() -> Result<String> {
    // Register to restart with no command line arguments
    unsafe {
        RegisterApplicationRestart(PCWSTR::null(), REGISTER_APPLICATION_RESTART_FLAGS(0))?;
    }

    Ok("Application registered for restart".to_string())
}

// Install an MSIX update from the given package URI
pub fn install_update(package_uri: String) -> Result<()> {
    let package_manager = PackageManager::new()?;
    let uri = Uri::CreateUri(&HSTRING::from(&package_uri))?;

    let options = AddPackageOptions::new()?;
    // Defer installation until app closes
    options.SetDeferRegistrationWhenPackagesAreInUse(true)?;

    // Start the update installation with force update options
    let operation = package_manager.AddPackageByUriAsync(&uri, &options)?;
    let result = operation.get()?;
    let is_registered = result.IsRegistered()?;

    if is_registered {
        Ok(())
    } else {
        bail!("Failed to install update:\n{}", result.ErrorText()?)
    }
}
