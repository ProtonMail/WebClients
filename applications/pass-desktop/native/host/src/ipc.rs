use std::sync::Arc;
use std::time::Duration;

use anyhow::{anyhow, Result};
use interprocess::local_socket::{
    tokio::{prelude::*, Stream},
    Name,
};
use log::info;

use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt, BufReader},
    sync::Mutex,
    time::timeout,
};

use crate::native_message::{NativeErrorCode, NativeMessage, NativeMessageError};

// Compute ipc sock file path
fn get_ipc_path() -> Result<Name<'static>> {
    let name = "proton_pass.sock";
    // On Windows, use Namespace socket
    #[cfg(windows)]
    {
        use interprocess::local_socket::{GenericNamespaced, ToNsName};

        Ok(name.to_ns_name::<GenericNamespaced>()?)
    }
    // On Mac & Linux, use File socket
    #[cfg(not(windows))]
    {
        use interprocess::local_socket::{GenericFilePath, ToFsName};

        use crate::get_local_dir;

        Ok(get_local_dir()
            .map(|path| path.join(name))?
            .to_fs_name::<GenericFilePath>()?)
    }
}

pub type Ipc = BufReader<Stream>;

pub async fn connect_to_ipc() -> Result<Ipc> {
    let ipc_path = get_ipc_path()?;

    info!("Connecting to IPC {:#?}", ipc_path);

    let conn = timeout(Duration::from_secs(5), Stream::connect(ipc_path))
        .await
        .map_err(|_| anyhow!("IPC connect timed out"))??;

    Ok(BufReader::new(conn))
}

pub async fn call_ipc(ipc: &mut Ipc, request: String) -> Result<String> {
    ipc.get_mut().write_all(request.as_bytes()).await?;

    let mut response = String::new();
    ipc.read_line(&mut response).await?;

    Ok(response.trim_end_matches('\n').to_string())
}

pub async fn forward_to_ipc(request: String, ipc: Arc<Mutex<Option<Ipc>>>, msg: &NativeMessage) -> Result<String> {
    let mut guard = ipc.lock().await;

    // A cached connection can be stale if the desktop app restarted since we connected.
    // Try the call and, on failure, drop the connection and reconnect once so a stale
    // connection self-heals within this request instead of sacrificing it.
    for attempt in 0..2 {
        let mut conn = match guard.take() {
            Some(conn) => conn,
            None => match connect_to_ipc().await {
                Ok(conn) => conn,
                // A failed connect on the first attempt means the desktop app isn't running /
                // logged in; a failed reconnect (attempt 1) means a previously-live connection
                // went away mid-session (app restarting) — surface that as unresponsive, not
                // as "not logged in".
                Err(_) => {
                    let code = if attempt == 0 {
                        NativeErrorCode::DesktopAppNotLoggedIn
                    } else {
                        NativeErrorCode::HostNotResponding
                    };
                    return NativeMessageError::new(code).to_response(msg);
                }
            },
        };

        if let Ok(Ok(response)) = timeout(Duration::from_secs(10), call_ipc(&mut conn, request.clone())).await {
            *guard = Some(conn);
            return Ok(response);
        }
    }

    NativeMessageError::new(NativeErrorCode::HostNotResponding).to_response(msg)
}
