use std::{
    str::FromStr,
    sync::{Arc, Mutex},
};

use tauri::{Emitter, Manager, Url, WebviewUrl, WebviewWindowBuilder};

use crate::error::TauriError;
use crate::store;

pub fn get_user_agent(version: String) -> String {
    #[cfg(target_os = "macos")]
    let os_part = "Macintosh; Intel Mac OS X 10_15_7";
    #[cfg(target_os = "windows")]
    let os_part = "Windows NT 10.0; Win64; x64";
    #[cfg(target_os = "linux")]
    let os_part = "X11; Linux x86_64";
    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    let os_part = "";

    let product_part = format!("ProtonAuthenticator/{version}");
    let electron_part = "Electron/1.0.0";

    format!("Mozilla/5.0 ({os_part}) {product_part} {electron_part}")
}

#[tauri::command(async)]
#[specta::specta]
pub fn log_in(
    app: tauri::AppHandle,
    window_title: String,
    sso_url: String,
) -> Result<(), TauriError> {
    let parsed_url = Url::from_str(&sso_url).map_err(|err| TauriError::from(err.to_string()))?;
    let theme = store::get_theme(app.clone()).unwrap_or_default();

    let tauri_theme = store::into_tauri_theme(&theme);
    let version = app.package_info().version.to_string();
    let should_send_destroyed = Arc::new(Mutex::new(true));
    let should_send_destroyed_clone = should_send_destroyed.clone();

    let webview_handle = app.clone();
    let window = WebviewWindowBuilder::new(&app, "login", WebviewUrl::External(parsed_url.clone()))
        .theme(tauri_theme)
        .title(&window_title)
        .user_agent(&get_user_agent(version))
        .inner_size(400.0, 600.0)
        .resizable(true)
        .always_on_top(true)
        .on_navigation(move |url| {
            let path = url.path();

            // Catch Account callback and pass it back to the app window
            if path.contains("/login") {
                let fragment = url.fragment().unwrap_or_default();

                let result = webview_handle
                    .emit_to("main", "authenticator:login", fragment)
                    .and_then(|_| {
                        let mut should_send_destroyed = should_send_destroyed_clone.lock().unwrap();
                        *should_send_destroyed = false;

                        if let Some(window) = webview_handle.get_webview_window("login") {
                            window.close()?;
                        }

                        Ok(())
                    });

                if let Err(err) = result {
                    log::error!("Login flow error: {}", err);
                }

                return false;
            }

            true
        })
        .build()
        .map_err(TauriError::from)?;

    let events_handle = app.clone();
    window.on_window_event(move |event| {
        if let tauri::WindowEvent::Destroyed = event {
            if *should_send_destroyed.lock().unwrap() {
                let _ = events_handle.emit_to("main", "authenticator:login:destroyed", true);
            }
        }
    });

    Ok(())
}
