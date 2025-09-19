use log::LevelFilter;

#[cfg(debug_assertions)]
use specta_typescript::Typescript;

use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

mod auth;
mod biometrics;
mod crypto;
mod error;
mod storage_key;
mod store;

use tauri_specta::{collect_commands, collect_events, Builder};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = Builder::<tauri::Wry>::new()
        .commands(collect_commands![
            auth::log_in,
            biometrics::can_check_presence,
            biometrics::check_presence,
            storage_key::generate_storage_key,
            storage_key::get_storage_key,
            storage_key::remove_storage_key,
            store::get_theme,
            store::set_theme,
        ])
        .events(collect_events![]);

    #[cfg(debug_assertions)]
    builder
        .export(
            Typescript::default().header("// @ts-nocheck"),
            "../src/lib/tauri/generated/__bindings__.ts",
        )
        .expect("Failed to export typescript bindings");

    tauri::Builder::default()
        .invoke_handler(builder.invoke_handler())
        .setup(|app| {
            let version = app.package_info().version.to_string();
            let mut win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title("Proton Authenticator")
                .user_agent(&auth::get_user_agent(version))
                .accept_first_mouse(true)
                .inner_size(800.0, 600.0)
                .min_inner_size(420.0, 480.0);

            if !cfg!(debug_assertions) {
                win_builder = win_builder.content_protected(true)
            }

            win_builder.build()?;

            Ok(())
        })
        .plugin(
            tauri_plugin_log::Builder::new()
                .clear_targets()
                .level(LevelFilter::Debug)
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Stdout,
                ))
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("logs".to_string()),
                    },
                ))
                .build(),
        )
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app
                .get_webview_window("main")
                .and_then(|window| window.set_focus().ok());
        }))
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
