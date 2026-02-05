use anyhow::{bail, Result};
use windows::{
    core::{HSTRING, PCWSTR},
    Foundation::Uri,
    Management::Deployment::{AddPackageOptions, PackageManager},
    Win32::System::Recovery::{RegisterApplicationRestart, REGISTER_APPLICATION_RESTART_FLAGS},
};

// Beware, this block requires packageManagement capacity in Windows (AppxManifest.xml)
// <Capabilities>
//     <rescap:Capability Name="packageManagement" />
// </Capabilities>
//
// No big issues if it's disabled in company managed environment
// But for b2c auto update, we need this capability

// Register the application to restart after update
// Call this BEFORE calling install_update()
pub fn register_for_restart() -> Result<()> {
    // Register to restart with no command line arguments
    unsafe {
        RegisterApplicationRestart(PCWSTR::null(), REGISTER_APPLICATION_RESTART_FLAGS(0))?;
    }

    Ok(())
}

// Install an MSIX update from the given package URI
pub fn install_update(package_uri: String) -> Result<()> {
    // Create PackageManager
    let package_manager = PackageManager::new()?;

    // Create URI for the package location
    let uri = Uri::CreateUri(&HSTRING::from(&package_uri))?;

    // Configure deployment options
    let options = AddPackageOptions::new()?;

    // Force app shutdown before installing
    options.SetDeferRegistrationWhenPackagesAreInUse(false)?;

    // Start the update installation with force update options
    let operation = package_manager.AddPackageByUriAsync(&uri, &options)?;

    // Wait for the operation to complete
    let result = operation.get()?;

    // Check if installation was successful
    if result.IsRegistered()? {
        Ok(())
    } else {
        // Get error details if available
        let error_text = result.ErrorText()?;
        bail!("Failed to install update: {}", error_text)
    }
}
