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
pub fn register_for_restart() -> Result<String> {
    // Register to restart with no command line arguments
    unsafe {
        RegisterApplicationRestart(PCWSTR::null(), REGISTER_APPLICATION_RESTART_FLAGS(0))?;
    }

    Ok("Application registered for restart".to_string())
}

// Install an MSIX update from the given package URI
pub fn install_update(package_uri: String) -> Result<String> {
    let mut feedback = Vec::new();

    feedback.push(format!("Starting MSIX update from: {}", package_uri));

    // Create PackageManager
    feedback.push("Creating PackageManager...".to_string());
    let package_manager = PackageManager::new()?;
    feedback.push("PackageManager created successfully".to_string());

    // Create URI for the package location
    feedback.push("Creating URI...".to_string());
    let uri = Uri::CreateUri(&HSTRING::from(&package_uri))?;
    feedback.push(format!("URI created: {}", package_uri));

    // Configure deployment options
    feedback.push("Configuring deployment options...".to_string());
    let options = AddPackageOptions::new()?;

    // Force app shutdown before installing
    options.SetDeferRegistrationWhenPackagesAreInUse(false)?;
    feedback.push("Options configured: DeferRegistration=false".to_string());

    // Start the update installation with force update options
    feedback.push("Starting async package installation...".to_string());
    let operation = package_manager.AddPackageByUriAsync(&uri, &options)?;

    // Wait for the operation to complete
    feedback.push("Waiting for installation to complete...".to_string());
    let result = operation.get()?;

    // Get deployment result details
    let is_registered = result.IsRegistered()?;
    feedback.push(format!("Installation completed. IsRegistered: {}", is_registered));

    // Get extended error code
    let extended_error_code = result.ExtendedErrorCode()?;
    feedback.push(format!("Extended error code: {:?}", extended_error_code));

    // Get activity ID for diagnostics
    if let Ok(activity_id) = result.ActivityId() {
        feedback.push(format!("Activity ID: {:?}", activity_id));
    }

    // Check if installation was successful
    if is_registered {
        feedback.push("✓ Package successfully installed and registered".to_string());
        Ok(feedback.join("\n"))
    } else {
        // Get error details if available
        let error_text = result.ErrorText()?;
        feedback.push(format!("✗ Installation failed: {}", error_text));
        bail!("Failed to install update:\n{}", feedback.join("\n"))
    }
}
