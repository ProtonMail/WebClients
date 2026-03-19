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
use tokio::net::windows::named_pipe::{ClientOptions, NamedPipeServer, ServerOptions};
#[cfg(unix)]
use tokio::net::UnixListener;
#[cfg(unix)]
use tokio_stream;

#[cfg(windows)]
struct NamedPipeListener {
    rx: tokio::sync::mpsc::UnboundedReceiver<NamedPipeServer>,
}

#[cfg(windows)]
impl NamedPipeListener {
    fn new(path: String) -> std::io::Result<Self> {
        let (tx, rx) = tokio::sync::mpsc::unbounded_channel();

        let mut listener = ServerOptions::new().first_pipe_instance(true).create(&path)?;

        tokio::spawn(async move {
            loop {
                if let Err(e) = listener.connect().await {
                    eprintln!("[SSH Agent] Failed to connect to named pipe: {}", e);
                    break;
                }

                if tx.send(listener).is_err() {
                    break;
                }

                listener = match ServerOptions::new().create(&path) {
                    Ok(l) => l,
                    Err(e) => {
                        eprintln!("[SSH Agent] Failed to create named pipe: {}", e);
                        break;
                    }
                };
            }
        });

        Ok(Self { rx })
    }
}

#[cfg(windows)]
impl Stream for NamedPipeListener {
    type Item = std::io::Result<NamedPipeServer>;

    fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
        self.rx.poll_recv(cx).map(|v| v.map(Ok))
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

type IsUnlockedCallback = ThreadsafeFunction<Option<String>>;

struct SshAgentInstance {
    socket_path: PathBuf,
}

pub struct SshAgentManager;

#[derive(Clone)]
struct PassSshAgent {
    is_unlocked_callback: IsUnlockedCallback,
}

impl PassSshAgent {
    async fn check_unlocked(&self, key: Option<String>) -> bool {
        println!("[Rust SSH Agent] Calling JavaScript lock check callback...");

        match self.is_unlocked_callback.call_async::<Promise<bool>>(Ok(key)).await {
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
        {
            if socket_path.exists() {
                println!("Removing existing socket file");
                std::fs::remove_file(&socket_path)?;
            }

            println!("Binding to Unix socket");
            let listener = UnixListener::bind(&socket_path)
                .map_err(|e| anyhow::anyhow!("Failed to bind to socket {}: {}", socket_path.display(), e))?;

            let agent_handler = PassSshAgent { is_unlocked_callback };

            println!("Creating UnixListenerStream");
            let stream = tokio_stream::wrappers::UnixListenerStream::new(listener);
            println!("UnixListenerStream created successfully");

            println!("Spawning SSH agent server task");
            let task_handle = tokio::spawn(async move {
                println!("SSH agent server task started");
                match agent::server::serve(stream, agent_handler).await {
                    Ok(_) => println!("SSH agent server completed successfully"),
                    Err(e) => {
                        eprintln!("SSH agent server error: {}", e);
                    }
                }
                println!("SSH agent server task ended");
            });

            println!("Task spawned, handle: {:?}", task_handle);
        }

        #[cfg(windows)]
        {
            println!("Creating Windows named pipe server");

            let pipe_path = socket_path.to_string_lossy().to_string();
            let agent_handler = PassSshAgent { is_unlocked_callback };

            println!("Creating NamedPipeListener stream");
            let stream = NamedPipeListener::new(pipe_path)
                .map_err(|e| anyhow::anyhow!("Failed to create named pipe listener: {}", e))?;

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
            });
        }

        let instance = SshAgentInstance {
            socket_path: socket_path.clone(),
        };
        *instance_guard = Some(instance);

        println!("SSH agent server started");
        Ok("SSH agent started successfully".to_string())
    }

    pub fn stop_agent() -> Result<String> {
        println!("Stopping SSH agent server");

        let mut instance_guard = SSH_AGENT_INSTANCE.lock().unwrap();

        if let Some(instance) = instance_guard.take() {
            if let Err(e) = std::fs::remove_file(&instance.socket_path) {
                // FIXME: error on Windows: Failed to remove SSH socket: The parameter is incorrect. (os error 87)
                println!("Failed to remove SSH socket: {}", e);
            }

            println!("SSH agent server stopped successfully");
            Ok("SSH agent stopped successfully".to_string())
        } else {
            println!("SSH agent is not running");
            Ok("SSH agent was not running".to_string())
        }
    }

    pub async fn send_keys(keys: Vec<SshKeyData>) -> Result<String> {
        let socket_path = {
            let instance_guard = SSH_AGENT_INSTANCE.lock().unwrap();
            if let Some(instance) = instance_guard.as_ref() {
                instance.socket_path.clone()
            } else {
                return Err(anyhow::anyhow!("SSH agent is not running"));
            }
        };

        println!("sending keys to: {}", socket_path.display());
        Self::add_keys_to_agent(&socket_path, keys).await
    }

    async fn add_keys_to_agent(socket_path: &std::path::Path, keys: Vec<SshKeyData>) -> Result<String> {
        println!("Connecting to SSH agent at: {}", socket_path.display());

        #[cfg(unix)]
        let mut client = {
            if !socket_path.exists() {
                return Err(anyhow::anyhow!("Socket file does not exist: {}", socket_path.display()));
            }

            match AgentClient::connect_uds(socket_path).await {
                Ok(client) => {
                    println!("Successfully connected to SSH agent");
                    client
                }
                Err(e) => return Err(anyhow::anyhow!("Failed to connect to SSH agent: {}", e)),
            }
        };

        #[cfg(windows)]
        let mut client = {
            let pipe_path = socket_path.to_string_lossy().to_string();
            AgentClient::connect_named_pipe(pipe_path).await.unwrap()
        };

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
