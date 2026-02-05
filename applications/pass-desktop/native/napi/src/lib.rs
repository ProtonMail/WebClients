#[macro_use]
extern crate napi_derive;

mod autotypes;
mod clipboards;

#[cfg(windows)]
mod updater;

use autotypes::Autotype as AutotypeCore;
use napi::tokio;

#[macro_export]
macro_rules! napi_res {
    ($e:expr) => {
        $e.map_err(|e| napi::Error::from_reason(e.to_string()))
    };
}
#[napi]
pub mod biometric {
    use napi::bindgen_prelude::{Buffer, Uint8Array};

    use shared::biometrics::*;

    #[napi]
    pub async fn can_check_presence() -> napi::Result<bool> {
        napi_res!(Biometrics::can_check_presence())
    }

    #[napi]
    pub async fn check_presence(handle: Buffer, reason: String) -> napi::Result<()> {
        napi_res!(Biometrics::check_presence(handle.into(), reason))
    }

    #[napi]
    pub async fn get_secret(key: String) -> napi::Result<Uint8Array> {
        let vec = napi_res!(Biometrics::get_secret(key))?;
        Ok(Uint8Array::new(vec))
    }

    #[napi]
    pub async fn set_secret(key: String, secret: Uint8Array) -> napi::Result<()> {
        napi_res!(Biometrics::set_secret(key, secret.to_vec()))
    }

    #[napi]
    pub async fn delete_secret(key: String) -> napi::Result<()> {
        napi_res!(Biometrics::delete_secret(key))
    }
}

#[napi]
pub mod clipboard {
    use crate::clipboards::*;

    #[napi]
    pub async fn write_text(text: String, sensitive: bool) -> napi::Result<()> {
        napi_res!(Clipboard::write(&text, sensitive))
    }

    #[napi]
    pub async fn read() -> napi::Result<String> {
        napi_res!(Clipboard::read())
    }
}

#[napi]
pub mod napi_native_messaging {
    use shared::nm_install;

    #[napi]
    pub async fn install(binary_path: String) -> napi::Result<()> {
        napi_res!(nm_install::nm_install(&binary_path))
    }
}

#[napi]
pub struct Autotype {
    autotype: AutotypeCore,
}

#[napi]
// If you have the rust-analyzer error "Did not find struct `Autotype` parsed before expand #[napi] for impl"
// then add this line to your settings.json:
// "rust-analyzer.procMacro.ignored": { "napi-derive": ["napi"] }
// (See https://github.com/napi-rs/napi-rs/issues/2390)
impl Autotype {
    #[napi(factory)]
    pub async fn create() -> napi::Result<Self> {
        napi_res!(
            // Use spawn_blocking to avoid app being unresponsive while Linux OS permission prompt is not closed
            tokio::task::spawn_blocking(move || {
                let autotype = AutotypeCore::new().map_err(|e| napi::Error::from_reason(e.to_string()))?;
                Ok(Autotype { autotype })
            })
            .await
        )?
    }

    #[napi]
    pub fn perform_autotype(&mut self, fields: Vec<String>, enter_at_the_end: Option<bool>) -> napi::Result<()> {
        napi_res!(self.autotype.perform_autotype(fields, enter_at_the_end))
    }
}

#[napi]
pub mod msix_updater {
    #[napi]
    pub async fn install_update(package_uri: String) -> napi::Result<String> {
        #[cfg(windows)]
        {
            use super::updater;
            use napi::tokio;

            // Register for restart before updating
            let restart_msg = updater::register_for_restart().map_err(|e| napi::Error::from_reason(e.to_string()))?;

            // Install the update (spawn blocking since Windows APIs are synchronous)
            let install_msg = tokio::task::spawn_blocking(move || {
                updater::install_update(package_uri).map_err(|e| napi::Error::from_reason(e.to_string()))
            })
            .await
            .map_err(|e| napi::Error::from_reason(e.to_string()))??;

            Ok(format!("{}\n\n{}", restart_msg, install_msg))
        }

        #[cfg(not(windows))]
        {
            let _ = package_uri; // Avoid unused variable warning
            Err(napi::Error::from_reason("MSIX updates are only supported on Windows"))
        }
    }
}
