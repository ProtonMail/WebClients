use anyhow::{Error, Result};
#[cfg(windows)]
use futures::stream::Stream;
use napi::bindgen_prelude::Promise;
use napi::threadsafe_function::ThreadsafeFunction;
use russh_keys::agent::client::{AgentClient, AgentStream};
use russh_keys::agent::Constraint;
use russh_keys::{agent, ssh_key, PrivateKey, PublicKeyBase64};
use std::path::PathBuf;
#[cfg(windows)]
use std::pin::Pin;
use std::sync::{Arc, Mutex};
#[cfg(windows)]
use std::task::{Context, Poll};
#[cfg(windows)]
use tokio::net::windows::named_pipe::{NamedPipeServer, ServerOptions};
#[cfg(unix)]
use tokio::net::UnixListener;
#[cfg(unix)]
use tokio_stream;
#[cfg(windows)]
use tokio_util::sync::CancellationToken;

#[cfg(windows)]
struct NamedPipeListener {
    rx: tokio::sync::mpsc::Receiver<std::io::Result<NamedPipeServer>>,
    cancel_token: CancellationToken,
}

#[cfg(windows)]
impl NamedPipeListener {
    fn new(path: String) -> std::io::Result<Self> {
        let (tx, rx) = tokio::sync::mpsc::channel(10);
        let cancel_token = CancellationToken::new();
        let cancel_clone = cancel_token.clone();
        let mut listener = ServerOptions::new().first_pipe_instance(true).create(&path)?;

        tokio::spawn(async move {
            loop {
                tokio::select! {
                    _ = cancel_clone.cancelled() => {
                        eprintln!("[SSH Agent] Named pipe listener shutting down");
                        break;
                    }
                    connect_result = listener.connect() => {
                        match connect_result {
                            Ok(_) => {
                                if let Err(e) = tx.send(Ok(listener)).await {
                                    eprintln!("[SSH Agent] Receiver connection failed: {}", e);
                                    break;
                                }
                                listener = match ServerOptions::new().create(&path) {
                                    Ok(l) => l,
                                    Err(e) => {
                                        eprintln!("[SSH Agent] Failed to create next named pipe: {}", e);
                                        break;
                                    }
                                };
                            }
                            Err(e) => {
                                eprintln!("[SSH Agent] Failed to connect to named pipe: {}", e);
                                break;
                            }
                        }
                    }
                }
            }
        });

        Ok(Self { rx, cancel_token })
    }
}

#[cfg(windows)]
impl Stream for NamedPipeListener {
    type Item = std::io::Result<NamedPipeServer>;

    fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
        self.rx.poll_recv(cx)
    }
}

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

static SSH_AGENT_INSTANCE: Mutex<Option<SshAgentInstance>> = Mutex::new(None);

type IsUnlockedCallback = ThreadsafeFunction<Option<String>, Promise<bool>>;

struct SshAgentInstance {
    socket_path: PathBuf,
    task_handle: tokio::task::JoinHandle<()>,
    #[cfg(windows)]
    named_pipe_cancel_token: CancellationToken,
}

pub struct SshAgentManager;

#[derive(Clone)]
struct PassSshAgent {
    is_unlocked_callback: Arc<IsUnlockedCallback>,
}

impl PassSshAgent {
    async fn check_unlocked(&self, key: Option<String>) -> bool {
        println!("[Rust SSH Agent] Calling JavaScript lock check callback...");

        match self.is_unlocked_callback.call_async(Ok(key)).await {
            Ok(promise) => match promise.await {
                Ok(is_unlocked) => {
                    println!("[Rust SSH Agent] Lock check result: {}", is_unlocked);
                    is_unlocked
                }
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
        println!(
            "confirm() called. Key fingerprint: {:?}",
            key.fingerprint(Default::default())
        );

        let fut = async move {
            let is_unlocked = self.check_unlocked(Some(key.public_key_base64())).await;
            (self, is_unlocked)
        };

        Box::new(Box::pin(fut))
    }

    async fn confirm_request(&self, msg: agent::server::MessageType) -> bool {
        println!("SSH agent confirming request");

        match msg {
            // For sign operations, returns true to let the confirm() method above handle the unlock check
            agent::server::MessageType::Sign => {
                println!("Sign request will be handled by confirm()");
                true
            }
            _ => {
                let is_unlocked = self.check_unlocked(None).await;
                is_unlocked
            }
        }
    }
}

impl SshAgentManager {
    pub fn start_agent(is_unlocked_callback: IsUnlockedCallback) -> Result<String> {
        println!("Starting SSH agent server");

        let mut instance_guard = SSH_AGENT_INSTANCE.lock().unwrap();

        if instance_guard.is_some() {
            return Ok("SSH agent is already running".to_string());
        }

        let socket_path = Self::get_socket_path()?;

        #[cfg(unix)]
        let task_handle = {
            if socket_path.exists() {
                println!("Removing existing socket file");
                std::fs::remove_file(&socket_path)?;
            }

            println!("Binding to Unix socket");
            let listener = UnixListener::bind(&socket_path)
                .map_err(|e| anyhow::anyhow!("Failed to bind to socket {}: {}", socket_path.display(), e))?;

            let agent_handler = PassSshAgent { is_unlocked_callback: Arc::new(is_unlocked_callback) };

            println!("Creating UnixListenerStream");
            let stream = tokio_stream::wrappers::UnixListenerStream::new(listener);
            println!("UnixListenerStream created successfully");

            println!("Spawning SSH agent server task");
            tokio::spawn(async move {
                println!("SSH agent server task started");
                match agent::server::serve(stream, agent_handler).await {
                    Ok(_) => println!("SSH agent server completed successfully"),
                    Err(e) => {
                        eprintln!("SSH agent server error: {}", e);
                    }
                }
                println!("SSH agent server task ended");
            })
        };

        #[cfg(windows)]
        let (task_handle, named_pipe_cancel_token) = {
            println!("Creating Windows named pipe server");

            let pipe_path = socket_path.to_string_lossy().to_string();
            let agent_handler = PassSshAgent { is_unlocked_callback: Arc::new(is_unlocked_callback) };

            println!("Creating NamedPipeListener stream");
            let stream = NamedPipeListener::new(pipe_path)
                .map_err(|e| anyhow::anyhow!("Failed to create named pipe listener: {}", e))?;

            let cancel_token = stream.cancel_token.clone();

            println!("Spawning SSH agent server task");
            let handle = tokio::spawn(async move {
                println!("SSH agent server task started");
                match agent::server::serve(stream, agent_handler).await {
                    Ok(_) => println!("SSH agent server completed successfully"),
                    Err(e) => {
                        eprintln!("SSH agent server error: {}", e);
                    }
                }
                println!("SSH agent server task ended");
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

        println!("SSH agent server started");
        Ok("SSH agent started successfully".to_string())
    }

    pub async fn stop_agent() -> Result<String> {
        println!("Stopping SSH agent server");

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

            Ok("SSH agent stopped successfully".to_string())
        } else {
            Ok("SSH agent was not running".to_string())
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

    pub async fn remove_all_keys() -> Result<()> {
        let mut client = Self::connect_agent_client().await?;

        let identities = client
            .request_identities()
            .await
            .map_err(|e| anyhow::anyhow!("Failed to request identities: {}", e))?;

        if identities.is_empty() {
            return Ok(());
        }

        // client.remove_all_identities() fails with "Agent failure" error
        // (with either russh-keys = "0.49.2" or russh = "0.54.6")
        // so we currently have to use client.remove_identity() instead
        for identity in identities {
            if let Err(e) = client.remove_identity(&identity).await {
                eprintln!("Failed to remove a key: {}", e);
            }
        }

        println!("Successfully removed SSH keys from agent");
        Ok(())
    }

    pub async fn set_keys(keys: Vec<SshKeyData>) -> Result<String> {
        Self::remove_all_keys().await?;
        Self::add_keys_to_agent(keys).await
    }

    async fn add_keys_to_agent(keys: Vec<SshKeyData>) -> Result<String> {
        let mut client = Self::connect_agent_client().await?;

        for key in keys {
            match Self::add_identity_to_agent(&mut client, &key).await {
                Ok(_) => {
                    println!("Successfully added key to SSH agent: {}", key.name);
                }
                Err(e) => {
                    eprintln!("Failed to add key {} to SSH agent: {}", key.name, e);
                }
            }
        }

        Ok(format!("Added keys to SSH agent successfully"))
    }

    async fn add_identity_to_agent<S>(client: &mut AgentClient<S>, key: &SshKeyData) -> Result<(), Error>
    where
        S: AgentStream + Unpin,
    {
        let private_key = Self::parse_private_key(&key.private_key)?;
        client.add_identity(&private_key, &[Constraint::Confirm]).await?;
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
