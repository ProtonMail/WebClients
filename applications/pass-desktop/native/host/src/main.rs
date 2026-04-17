mod ipc;
mod unlock;

use anyhow::{anyhow, Context, Result};
use dirs::data_local_dir;
use ftail::Ftail;
use ipc::{call_ipc, connect_to_ipc, Ipc};
use log::error;
use log::{info, LevelFilter};
use native_messaging::event_loop;
use native_messaging::host::{NmError, Sender};
use std::fs::{create_dir_all, remove_file};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;
use tokio::time::timeout;
use unlock::{intercept_unlock, Interception};

fn ensure_local_dir() -> Result<()> {
    let path = get_local_dir()?;
    if !path.exists() || !path.is_dir() {
        create_dir_all(path)?;
    }
    Ok(())
}

fn get_local_dir() -> Result<PathBuf> {
    data_local_dir()
        .map(|dir| dir.join("Proton Pass"))
        .ok_or(anyhow!("Failed to compute local dir"))
}

fn get_log_path() -> Result<PathBuf> {
    get_local_dir().map(|path| path.join("proton_pass_nm_host.log"))
}

fn cleanup_old_logs(log_path: &Path) -> Result<()> {
    let path = PathBuf::from(format!("{}.old", log_path.to_string_lossy()));
    if path.exists() {
        remove_file(&path).map_err(|e| anyhow!(e))?;
    }
    Ok(())
}

async fn handle_message(request: String, send: Sender, ipc: Ipc) -> Result<()> {
    info!("Request received");

    let response = match intercept_unlock(&request).await? {
        Interception::Intercepted(message) => message,
        Interception::Continue => timeout(Duration::from_secs(10), call_ipc(ipc, request))
            .await
            .with_context(|| "Timeout on IPC with Desktop App")??,
    };

    send.send(&response).await?;
    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    ensure_local_dir()?;

    let log_path = get_log_path()?;
    cleanup_old_logs(&log_path)?;
    Ftail::new()
        .single_file(&log_path, true, LevelFilter::Info)
        .max_file_size(1)
        .init()?;

    info!("Proton Pass Native Messaging host is starting...");

    let ipc = connect_to_ipc().await?;

    event_loop(move |req: String, sender: Sender| {
        let ipc = Arc::clone(&ipc);
        async move {
            if let Err(e) = handle_message(req, sender, ipc).await {
                error!("Native Messaging handle message failed: {:?}", e);
            }
            Ok::<(), NmError>(())
        }
    })
    .await
    .with_context(|| "Native Messaging event loop error")
}
