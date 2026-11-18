use native_messaging::{install, manifest_path, Scope};
use std::io;
use std::path::Path;

const HOST_NAME: &str = "me.proton.pass.nm";
const DESCRIPTION: &str = "Proton Pass host for native messaging with the desktop app";
const CHROME_ALLOWED_ORIGINS: [&str; 3] = [
    "chrome-extension://ghmbeldphafepmbegfdlkpapadhbakde/", // Chrome web store
    "chrome-extension://hlaiofkbmjenhgeinjlmkafaipackfjh/", // Chrome web store beta
    "chrome-extension://gcllgfdnfnllodcaambdaknbipemelie/", // Edge Add-ons
];
const FIREFOX_ALLOWED_EXTENSIONS: [&str; 1] = [
    "78272b6fa58f4a1abaac99321d503a20@proton.me", // Firefox ID
];
const CHROMIUM_BROWSERS: [&str; 5] = ["chrome", "chromium", "edge", "brave", "vivaldi"];
const FIREFOX_BROWSERS: [&str; 2] = ["firefox", "librewolf"];

#[derive(Debug)]
pub enum InstallOutcome {
    Installed,
    Skipped,
    Failed(io::Error),
}

#[derive(Debug)]
pub struct BrowserInstall {
    pub browser: &'static str,
    pub outcome: InstallOutcome,
}

/// Each browser installs on its own: a failure on one never prevents the others.
/// A browser whose app-data folder is missing is skipped, so no folder is created for a
/// browser the user never ran. On macOS 27+ creating such a folder is also refused (EPERM).
pub fn install_all(chromium_binary_path: &Path, firefox_binary_path: &Path) -> Vec<BrowserInstall> {
    // The two paths are identical except on packaged Windows (MSIX), where they
    // diverge for a single reason: Firefox cannot launch the appExecutionAlias
    // stub that Chromium uses. That stub is a 0-byte APPEXECLINK reparse point,
    // and Firefox's subprocess launcher stats the host path and rejects reparse
    // points before launch, so on Windows it gets a real exe copied out of the
    // package instead. See IDTEAM-5762 for the full findings.
    let chromium = CHROMIUM_BROWSERS.map(|browser| install_browser(browser, chromium_binary_path));
    let firefox = FIREFOX_BROWSERS.map(|browser| install_browser(browser, firefox_binary_path));
    chromium.into_iter().chain(firefox).collect()
}

fn install_browser(browser: &'static str, binary_path: &Path) -> BrowserInstall {
    if app_data_folder_missing(browser) {
        return BrowserInstall {
            browser,
            outcome: InstallOutcome::Skipped,
        };
    }

    let allowed_origins = CHROME_ALLOWED_ORIGINS.map(String::from);
    let allowed_extensions = FIREFOX_ALLOWED_EXTENSIONS.map(String::from);

    let outcome = match install(
        HOST_NAME,
        DESCRIPTION,
        binary_path,
        &allowed_origins,
        &allowed_extensions,
        &[browser],
        Scope::User,
    ) {
        Ok(()) => InstallOutcome::Installed,
        Err(error) => InstallOutcome::Failed(error),
    };

    BrowserInstall { browser, outcome }
}

/// Windows registers in the registry and is never skipped. On macOS, Firefox writes to
/// `Mozilla/`, which can be missing while Firefox is installed, so it is never skipped.
fn skips_missing_app_data(browser: &str) -> bool {
    cfg!(target_os = "linux") || (cfg!(target_os = "macos") && browser != "firefox")
}

fn app_data_folder_missing(browser: &str) -> bool {
    skips_missing_app_data(browser)
        && manifest_path(browser, Scope::User, HOST_NAME)
            .ok()
            .and_then(|path| path.parent()?.parent().map(|app_data| !app_data.exists()))
            .unwrap_or(false)
}

#[cfg(all(test, target_os = "macos"))]
mod tests {
    use super::*;
    use std::fs;
    use std::os::unix::fs::PermissionsExt;
    use std::path::PathBuf;
    use std::sync::Mutex;

    static HOME_LOCK: Mutex<()> = Mutex::new(());

    struct FakeHome {
        root: PathBuf,
        previous: Option<std::ffi::OsString>,
    }

    impl FakeHome {
        fn new(name: &str) -> Self {
            let root = std::env::temp_dir().join(format!("pass-nm-install-{}-{}", name, std::process::id()));
            let _ = fs::remove_dir_all(&root);
            fs::create_dir_all(&root).unwrap();
            let previous = std::env::var_os("HOME");
            std::env::set_var("HOME", &root);
            Self { root, previous }
        }

        fn app_data(&self, folder: &str) -> PathBuf {
            let path = self.root.join("Library/Application Support").join(folder);
            fs::create_dir_all(&path).unwrap();
            path
        }

        fn manifest(&self, folder: &str) -> PathBuf {
            self.root
                .join("Library/Application Support")
                .join(folder)
                .join("NativeMessagingHosts")
                .join(format!("{HOST_NAME}.json"))
        }
    }

    impl Drop for FakeHome {
        fn drop(&mut self) {
            match &self.previous {
                Some(value) => std::env::set_var("HOME", value),
                None => std::env::remove_var("HOME"),
            }
            let _ = fs::remove_dir_all(&self.root);
        }
    }

    fn outcome_of<'a>(results: &'a [BrowserInstall], browser: &str) -> &'a InstallOutcome {
        &results.iter().find(|result| result.browser == browser).unwrap().outcome
    }

    #[test]
    fn installs_only_where_the_browser_app_data_exists() {
        let _guard = HOME_LOCK.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
        let home = FakeHome::new("skip");
        home.app_data("BraveSoftware/Brave-Browser");
        let binary = home.root.join("pass-desktop-host");

        let results = install_all(&binary, &binary);

        assert!(matches!(outcome_of(&results, "brave"), InstallOutcome::Installed));
        assert!(matches!(outcome_of(&results, "chrome"), InstallOutcome::Skipped));
        assert!(matches!(outcome_of(&results, "edge"), InstallOutcome::Skipped));
        assert!(matches!(outcome_of(&results, "librewolf"), InstallOutcome::Skipped));
        assert!(matches!(outcome_of(&results, "firefox"), InstallOutcome::Installed));
        assert!(!home.root.join("Library/Application Support/Google").exists());
        assert!(!home.root.join("Library/Application Support/LibreWolf").exists());

        let manifest = fs::read_to_string(home.manifest("BraveSoftware/Brave-Browser")).unwrap();
        assert!(manifest.contains(&format!("\"name\": \"{HOST_NAME}\"")));
        assert!(manifest.contains(binary.to_str().unwrap()));
        assert!(manifest.contains("chrome-extension://ghmbeldphafepmbegfdlkpapadhbakde/"));
    }

    #[test]
    fn a_failing_browser_does_not_stop_the_others() {
        let _guard = HOME_LOCK.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
        let home = FakeHome::new("isolation");
        let chrome = home.app_data("Google/Chrome");
        home.app_data("BraveSoftware/Brave-Browser");
        fs::set_permissions(&chrome, fs::Permissions::from_mode(0o555)).unwrap();
        let binary = home.root.join("pass-desktop-host");

        let results = install_all(&binary, &binary);
        fs::set_permissions(&chrome, fs::Permissions::from_mode(0o755)).unwrap();

        assert!(matches!(outcome_of(&results, "chrome"), InstallOutcome::Failed(_)));
        assert!(matches!(outcome_of(&results, "brave"), InstallOutcome::Installed));
        assert!(matches!(outcome_of(&results, "firefox"), InstallOutcome::Installed));
        assert!(home.manifest("BraveSoftware/Brave-Browser").exists());
        assert!(home.manifest("Mozilla").exists());
    }
}
