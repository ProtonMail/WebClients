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
use std::sync::{Arc, Mutex};
#[cfg(unix)]
use tokio::net::UnixListener;
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

static SSH_AGENT_INSTANCE: Mutex<Option<SshAgentInstance>> = Mutex::new(None);
static SSH_TRACKED_KEYS: Mutex<Vec<TrackedKey>> = Mutex::new(Vec::new());

type IsUnlockedCallback = ThreadsafeFunction<Option<String>, Promise<bool>>;

struct SshAgentInstance {
    socket_path: PathBuf,
    task_handle: tokio::task::JoinHandle<()>,
    #[cfg(windows)]
    named_pipe_cancel_token: CancellationToken,
}

/// Mutating methods are not concurrency-safe individually — they're
/// serialized at the napi boundary via `SSH_AGENT_OPS` in `lib.rs`.
pub struct SshAgentManager;

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

impl SshAgentManager {
    pub fn start_agent(is_unlocked_callback: IsUnlockedCallback) -> Result<()> {
        let mut instance_guard = SSH_AGENT_INSTANCE.lock().unwrap();

        if instance_guard.is_some() {
            return Ok(());
        }

        let socket_path = Self::get_socket_path()?;

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

        let instance = SshAgentInstance {
            socket_path: socket_path.clone(),
            task_handle,
            #[cfg(windows)]
            named_pipe_cancel_token,
        };
        *instance_guard = Some(instance);

        Ok(())
    }

    /// Safe to call regardless of agent state. No-op when not running.
    pub async fn destroy_agent() -> Result<()> {
        if let Err(e) = Self::remove_all_keys().await {
            eprintln!("Failed to clear SSH keys: {}", e);
        }

        let instance = {
            let mut instance_guard = SSH_AGENT_INSTANCE.lock().unwrap();
            instance_guard.take()
        };

        if let Some(instance) = instance {
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

            Ok(())
        } else {
            Ok(())
        }
    }

    async fn connect_agent_client() -> Result<AgentClient<impl AgentStream>> {
        let socket_path = {
            let instance_guard = SSH_AGENT_INSTANCE.lock().unwrap();
            if let Some(instance) = instance_guard.as_ref() {
                instance.socket_path.clone()
            } else {
                return Err(anyhow::anyhow!("SSH agent is not running"));
            }
        };

        #[cfg(unix)]
        {
            if let Ok(false) = socket_path.try_exists() {
                return Err(anyhow::anyhow!("Socket file does not exist: {}", socket_path.display()));
            }

            AgentClient::connect_uds(socket_path)
                .await
                .map_err(|e| anyhow::anyhow!("Failed to connect to SSH agent: {}", e))
        }

        #[cfg(windows)]
        {
            let pipe_path = socket_path.to_string_lossy().to_string();
            AgentClient::connect_named_pipe(pipe_path)
                .await
                .map_err(|e| anyhow::anyhow!("Failed to connect to SSH agent: {}", e))
        }
    }

    /// Safe to call regardless of agent state. When no agent is running,
    /// clears `SSH_TRACKED_KEYS` and returns `Ok(())` so stale entries
    /// don't survive into a later `start_agent` call.
    pub async fn remove_all_keys() -> Result<()> {
        if SSH_AGENT_INSTANCE.lock().unwrap().is_none() {
            SSH_TRACKED_KEYS.lock().unwrap().clear();
            return Ok(());
        }

        let mut client = Self::connect_agent_client().await?;
        let keys = SSH_TRACKED_KEYS.lock().unwrap().clone();

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
                removed.push(&key.public_key);
            }
        }

        // Edge-case: only clear keys that were successfully removed. Failed
        // ones stay tracked for future cleanup if agent is still running.
        SSH_TRACKED_KEYS
            .lock()
            .unwrap()
            .retain(|k| !removed.contains(&&k.public_key));

        Ok(())
    }

    /// Errors when no agent is running (via `connect_agent_client`
    /// inside `add_keys_to_agent`). The JS layer should flag keys as
    /// synced only on success.
    pub async fn set_keys(keys: Vec<SshKeyData>) -> Result<()> {
        Self::remove_all_keys().await?;
        Self::add_keys_to_agent(keys).await
    }

    async fn add_keys_to_agent(keys: Vec<SshKeyData>) -> Result<()> {
        let mut client = Self::connect_agent_client().await?;

        for key in keys {
            if let Err(e) = Self::add_identity_to_agent(&mut client, &key).await {
                eprintln!("Failed to add a key: {}", e);
            }
        }

        Ok(())
    }

    async fn add_identity_to_agent<S>(client: &mut AgentClient<S>, key: &SshKeyData) -> Result<(), Error>
    where
        S: AgentStream + Unpin,
    {
        let private_key = Self::parse_private_key(&key.private_key)?;

        client.add_identity(&private_key, &[Constraint::Confirm]).await?;

        let public_key = private_key.public_key().clone();
        SSH_TRACKED_KEYS.lock().unwrap().push(TrackedKey { public_key });

        Ok(())
    }

    fn parse_private_key(key_data: &str) -> Result<PrivateKey> {
        russh_keys::decode_secret_key(key_data, None).map_err(|e| anyhow::anyhow!("Failed to parse private key: {}", e))
    }

    pub async fn get_status() -> Result<AgentStatus> {
        let instance_guard = SSH_AGENT_INSTANCE.lock().unwrap();

        let socket_path = instance_guard
            .as_ref()
            .map(|instance| instance.socket_path.to_string_lossy().to_string());

        Ok(AgentStatus { socket_path })
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
}
