use std::sync::Arc;

use anyhow::Result;
use interprocess::local_socket::{
    tokio::{prelude::*, Stream},
    Name,
};
use log::info;

use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt, BufReader},
    sync::Mutex,
};

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

pub type Ipc = Arc<Mutex<BufReader<Stream>>>;

pub async fn connect_to_ipc() -> Result<Ipc> {
    let ipc_path = get_ipc_path()?;

    info!("Connecting to IPC {:#?}", &ipc_path);

    let conn = Stream::connect(ipc_path).await?;

    Ok(Arc::new(Mutex::new(BufReader::new(conn))))
}

pub async fn call_ipc(ipc: Ipc, request: String) -> Result<String> {
    let mut guard = ipc.lock().await;

    guard.get_mut().write_all(request.as_bytes()).await?;

    let mut response = String::new();
    guard.read_line(&mut response).await?;

    Ok(response.trim_end_matches('\n').to_string())
}
