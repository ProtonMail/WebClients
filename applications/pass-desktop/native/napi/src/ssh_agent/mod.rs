use anyhow::{Error, Result};
use napi::bindgen_prelude::Promise;
use napi::threadsafe_function::ThreadsafeFunction;
use russh_keys::agent::client::{AgentClient, AgentStream};
use russh_keys::agent::server::MessageType;
use russh_keys::agent::Constraint;
use russh_keys::{agent, ssh_key, PrivateKey, PublicKeyBase64};
#[cfg(unix)]
use std::os::unix::fs::{DirBuilderExt, PermissionsExt};
use std::path::PathBuf;
use std::sync::{Arc, OnceLock};
use std::time::Duration;
#[cfg(unix)]
use tokio::net::UnixListener;
use tokio::sync::{mpsc, oneshot};
#[cfg(windows)]
use tokio_util::sync::CancellationToken;

#[cfg(windows)]
mod windows_named_pipe;

#[napi_derive::napi(object)]
pub struct SshKeyData {
    pub id: String,
    pub name: String,
    pub public_key: String,
    pub private_key: String,
}

pub struct AgentStatus {
    pub socket_path: Option<String>,
}

#[derive(Debug, Clone)]
struct TrackedKey {
    pub public_key: ssh_key::PublicKey,
    // In the future more fields can be added here, e.g itemID
    // if we want to display key usage confirmation UI in Electron
}

type IsUnlockedCallback = ThreadsafeFunction<Option<String>, Promise<bool>>;

const CONNECT_TIMEOUT: Duration = Duration::from_secs(5);

struct SshAgentInstance {
    socket_path: PathBuf,
    task_handle: tokio::task::JoinHandle<()>,
    #[cfg(windows)]
    named_pipe_cancel_token: CancellationToken,
}

#[derive(Clone)]
struct PassSshAgent {
    is_unlocked_callback: Arc<IsUnlockedCallback>,
}

impl PassSshAgent {
    async fn check_unlocked(&self, key: Option<String>) -> bool {
        match self.is_unlocked_callback.call_async(Ok(key)).await {
            Ok(promise) => match promise.await {
                Ok(is_unlocked) => is_unlocked,
                Err(e) => {
                    eprintln!("[Rust SSH Agent] Promise resolution failed: {:?}", e);
                    false
                }
            },
            Err(e) => {
                eprintln!("[Rust SSH Agent] Lock check callback call failed: {:?}", e);
                false
            }
        }
    }
}

#[async_trait::async_trait]
impl agent::server::Agent for PassSshAgent {
    fn confirm(
        self,
        key: Arc<ssh_key::PrivateKey>,
    ) -> Box<dyn futures::future::Future<Output = (Self, bool)> + Send + Unpin> {
        let fut = async move {
            let is_unlocked = self.check_unlocked(Some(key.public_key_base64())).await;
            (self, is_unlocked)
        };

        Box::new(Box::pin(fut))
    }

    async fn confirm_request(&self, msg: MessageType) -> bool {
        match msg {
            // For sign operations, returns true to let the confirm() method above handle the unlock check
            MessageType::Sign |
            // For add/remove keys operations, no need to check for app lock
            MessageType::AddKeys | MessageType::RemoveKeys | MessageType::RemoveAllKeys => true,
            _ => {
                let is_unlocked = self.check_unlocked(None).await;
                is_unlocked
            }
        }
    }
}

enum SshAgentCommand {
    Start {
        is_unlocked_callback: IsUnlockedCallback,
        reply: oneshot::Sender<Result<()>>,
    },
    SetKeys {
        keys: Vec<SshKeyData>,
        reply: oneshot::Sender<Result<()>>,
    },
    RemoveAllKeys {
        reply: oneshot::Sender<Result<()>>,
    },
    Destroy {
        reply: oneshot::Sender<Result<()>>,
    },
    GetStatus {
        reply: oneshot::Sender<AgentStatus>,
    },
}

struct SshAgentActor {
    rx: mpsc::Receiver<SshAgentCommand>,
    instance: Option<SshAgentInstance>,
    tracked_keys: Vec<TrackedKey>,
}

impl SshAgentActor {
    async fn run(mut self) {
        while let Some(cmd) = self.rx.recv().await {
            match cmd {
                SshAgentCommand::Start {
                    is_unlocked_callback,
                    reply,
                } => {
                    let _ = reply.send(self.handle_start(is_unlocked_callback));
                }
                SshAgentCommand::SetKeys { keys, reply } => {
                    let _ = reply.send(self.handle_set_keys(keys).await);
                }
                SshAgentCommand::RemoveAllKeys { reply } => {
                    let _ = reply.send(self.handle_remove_all_keys().await);
                }
                SshAgentCommand::Destroy { reply } => {
                    let _ = reply.send(self.handle_destroy().await);
                }
                SshAgentCommand::GetStatus { reply } => {
                    let _ = reply.send(self.status());
                }
            }
        }
    }

    fn handle_start(&mut self, is_unlocked_callback: IsUnlockedCallback) -> Result<()> {
        if self.instance.is_some() {
            return Ok(());
        }

        let socket_path = get_socket_path()?;

        #[cfg(unix)]
        let task_handle = {
            if let Some(parent) = socket_path.parent() {
                std::fs::DirBuilder::new().recursive(true).mode(0o700).create(parent)?;
            }

            if socket_path.exists() {
                println!("Removing existing socket file");
                std::fs::remove_file(&socket_path)?;
            }

            let listener = UnixListener::bind(&socket_path)
                .map_err(|e| anyhow::anyhow!("Failed to bind to socket {}: {}", socket_path.display(), e))?;

            std::fs::set_permissions(&socket_path, std::fs::Permissions::from_mode(0o600))?;
            let agent_handler = PassSshAgent {
                is_unlocked_callback: Arc::new(is_unlocked_callback),
            };
            let stream = tokio_stream::wrappers::UnixListenerStream::new(listener);

            tokio::spawn(async move {
                if let Err(e) = agent::server::serve(stream, agent_handler).await {
                    eprintln!("SSH agent server error: {}", e);
                }
            })
        };

        #[cfg(windows)]
        let (task_handle, named_pipe_cancel_token) = {
            let pipe_path = socket_path.to_string_lossy().to_string();
            let agent_handler = PassSshAgent {
                is_unlocked_callback: Arc::new(is_unlocked_callback),
            };
            let stream = windows_named_pipe::NamedPipeListener::new(pipe_path)
                .map_err(|e| anyhow::anyhow!("Failed to create named pipe listener: {}", e))?;

            let cancel_token = stream.cancel_token.clone();

            let handle = tokio::spawn(async move {
                if let Err(e) = agent::server::serve(stream, agent_handler).await {
                    eprintln!("SSH agent server error: {}", e);
                }
            });

            (handle, cancel_token)
        };

        self.instance = Some(SshAgentInstance {
            socket_path,
            task_handle,
            #[cfg(windows)]
            named_pipe_cancel_token,
        });

        Ok(())
    }

    /// Safe to call regardless of agent state. No-op when not running.
    async fn handle_destroy(&mut self) -> Result<()> {
        if let Err(e) = self.handle_remove_all_keys().await {
            eprintln!("Failed to clear SSH keys: {}", e);
        }

        if let Some(instance) = self.instance.take() {
            #[cfg(windows)]
            {
                instance.named_pipe_cancel_token.cancel();
            }

            instance.task_handle.abort();

            #[cfg(unix)]
            {
                if let Err(e) = std::fs::remove_file(&instance.socket_path) {
                    println!("Failed to remove SSH socket: {}", e);
                }
            }
        }

        Ok(())
    }

    async fn connect_agent_client(&self) -> Result<AgentClient<impl AgentStream>> {
        let socket_path = match self.instance.as_ref() {
            Some(instance) => instance.socket_path.clone(),
            None => return Err(anyhow::anyhow!("SSH agent is not running")),
        };

        #[cfg(unix)]
        {
            if let Ok(false) = socket_path.try_exists() {
                return Err(anyhow::anyhow!("Socket file does not exist: {}", socket_path.display()));
            }

            tokio::time::timeout(CONNECT_TIMEOUT, AgentClient::connect_uds(socket_path))
                .await
                .map_err(|_| anyhow::anyhow!("Timed out connecting to SSH agent"))?
                .map_err(|e| anyhow::anyhow!("Failed to connect to SSH agent: {}", e))
        }

        #[cfg(windows)]
        {
            let pipe_path = socket_path.to_string_lossy().to_string();
            tokio::time::timeout(CONNECT_TIMEOUT, AgentClient::connect_named_pipe(pipe_path))
                .await
                .map_err(|_| anyhow::anyhow!("Timed out connecting to SSH agent"))?
                .map_err(|e| anyhow::anyhow!("Failed to connect to SSH agent: {}", e))
        }
    }

    /// Safe to call regardless of agent state. When no agent is running,
    /// clears `tracked_keys` and returns `Ok(())` so stale entries don't
    /// survive into a later `start_agent` call.
    async fn handle_remove_all_keys(&mut self) -> Result<()> {
        if self.instance.is_none() {
            self.tracked_keys.clear();
            return Ok(());
        }

        let mut client = self.connect_agent_client().await?;
        let keys = self.tracked_keys.clone();

        if keys.is_empty() {
            return Ok(());
        }

        let mut removed = Vec::new();

        for key in &keys {
            // client.remove_all_identities() fails with "Agent failure" error
            // (with either russh-keys = "0.49.2" or russh = "0.54.6")
            // so we currently have to use client.remove_identity() instead
            if let Err(e) = client.remove_identity(&key.public_key).await {
                eprintln!("Failed to remove a key: {}", e);
            } else {
                removed.push(key.public_key.clone());
            }
        }

        // Edge-case: only clear keys that were successfully removed. Failed
        // ones stay tracked for future cleanup if agent is still running.
        self.tracked_keys.retain(|k| !removed.contains(&k.public_key));

        Ok(())
    }

    /// Errors when no agent is running (via `connect_agent_client` inside
    /// `handle_add_keys`). The JS layer should flag keys as synced only on
    /// success.
    async fn handle_set_keys(&mut self, keys: Vec<SshKeyData>) -> Result<()> {
        self.handle_remove_all_keys().await?;
        self.handle_add_keys(keys).await
    }

    async fn handle_add_keys(&mut self, keys: Vec<SshKeyData>) -> Result<()> {
        let mut client = self.connect_agent_client().await?;

        for key in keys {
            if let Err(e) = self.add_identity_to_agent(&mut client, &key).await {
                eprintln!("Failed to add a key: {}", e);
            }
        }

        Ok(())
    }

    async fn add_identity_to_agent<S>(&mut self, client: &mut AgentClient<S>, key: &SshKeyData) -> Result<(), Error>
    where
        S: AgentStream + Unpin,
    {
        let private_key = parse_private_key(&key.private_key)?;

        client.add_identity(&private_key, &[Constraint::Confirm]).await?;

        let public_key = private_key.public_key().clone();
        self.tracked_keys.push(TrackedKey { public_key });

        Ok(())
    }

    fn status(&self) -> AgentStatus {
        let socket_path = self
            .instance
            .as_ref()
            .map(|instance| instance.socket_path.to_string_lossy().to_string());

        AgentStatus { socket_path }
    }
}

#[derive(Clone)]
struct SshAgentHandle {
    tx: mpsc::Sender<SshAgentCommand>,
}

impl SshAgentHandle {
    async fn send<T>(&self, make: impl FnOnce(oneshot::Sender<T>) -> SshAgentCommand) -> Result<T> {
        let (reply, rx) = oneshot::channel();
        self.tx
            .send(make(reply))
            .await
            .map_err(|_| anyhow::anyhow!("SSH agent actor is gone"))?;
        rx.await.map_err(|_| anyhow::anyhow!("SSH agent actor dropped reply"))
    }

    async fn start(&self, is_unlocked_callback: IsUnlockedCallback) -> Result<()> {
        self.send(|reply| SshAgentCommand::Start {
            is_unlocked_callback,
            reply,
        })
        .await?
    }

    async fn set_keys(&self, keys: Vec<SshKeyData>) -> Result<()> {
        self.send(|reply| SshAgentCommand::SetKeys { keys, reply }).await?
    }

    async fn remove_all_keys(&self) -> Result<()> {
        self.send(|reply| SshAgentCommand::RemoveAllKeys { reply }).await?
    }

    async fn destroy(&self) -> Result<()> {
        self.send(|reply| SshAgentCommand::Destroy { reply }).await?
    }

    async fn get_status(&self) -> Result<AgentStatus> {
        self.send(|reply| SshAgentCommand::GetStatus { reply }).await
    }
}

static SSH_AGENT_HANDLE: OnceLock<SshAgentHandle> = OnceLock::new();

pub struct SshAgentManager;

impl SshAgentManager {
    fn handle() -> SshAgentHandle {
        SSH_AGENT_HANDLE
            .get_or_init(|| {
                let (tx, rx) = mpsc::channel(32);
                let actor = SshAgentActor {
                    rx,
                    instance: None,
                    tracked_keys: Vec::new(),
                };
                tokio::spawn(actor.run());
                SshAgentHandle { tx }
            })
            .clone()
    }

    pub async fn start_agent(is_unlocked_callback: IsUnlockedCallback) -> Result<()> {
        Self::handle().start(is_unlocked_callback).await
    }

    pub async fn destroy_agent() -> Result<()> {
        Self::handle().destroy().await
    }

    pub async fn remove_all_keys() -> Result<()> {
        Self::handle().remove_all_keys().await
    }

    pub async fn set_keys(keys: Vec<SshKeyData>) -> Result<()> {
        Self::handle().set_keys(keys).await
    }

    pub async fn get_status() -> Result<AgentStatus> {
        Self::handle().get_status().await
    }
}

fn parse_private_key(key_data: &str) -> Result<PrivateKey> {
    russh_keys::decode_secret_key(key_data, None).map_err(|e| anyhow::anyhow!("Failed to parse private key: {}", e))
}

fn get_socket_path() -> Result<PathBuf> {
    #[cfg(unix)]
    {
        let home = std::env::home_dir().ok_or_else(|| anyhow::anyhow!("Could not get home directory"))?;
        Ok(home.join(".ssh").join("proton-pass-ssh-agent.sock"))
    }

    #[cfg(windows)]
    {
        Ok(PathBuf::from("\\\\.\\pipe\\openssh-ssh-agent"))
    }
}
