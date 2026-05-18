use anyhow::{bail, Result};
use napi::threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode};
use windows::{
    core::{HSTRING, PCWSTR},
    Foundation::{AsyncOperationProgressHandler, Uri},
    Management::Deployment::{AddPackageOptions, DeploymentProgress, DeploymentResult, PackageManager},
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
pub fn install_update(package_uri: String, on_progress: ThreadsafeFunction<u32>) -> Result<()> {
    let package_manager = PackageManager::new()?;
    let uri = Uri::CreateUri(&HSTRING::from(&package_uri))?;

    let options = AddPackageOptions::new()?;
    // Defer installation until app closes
    options.SetDeferRegistrationWhenPackagesAreInUse(true)?;

    let operation = package_manager.AddPackageByUriAsync(&uri, &options)?;

    let handler = AsyncOperationProgressHandler::<DeploymentResult, DeploymentProgress>::new(move |_, progress| {
        on_progress.call(Ok(progress.percentage), ThreadsafeFunctionCallMode::NonBlocking);
        Ok(())
    });
    operation.SetProgress(&handler)?;

    let result = operation.get()?;

    if result.IsRegistered()? {
        Ok(())
    } else {
        bail!("Failed to install update:\n{}", result.ErrorText()?)
    }
}
