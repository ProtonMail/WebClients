use anyhow::{Error, Result};
use russh_keys::{agent, ssh_key, PrivateKey};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
#[cfg(unix)]
use tokio::net::UnixListener;
use tokio::time::timeout;
use tokio::time::Duration;
#[cfg(unix)]
use tokio_stream;

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

#[derive(Clone)]
struct SshAgentInstance {
    socket_path: PathBuf,
}

pub struct SshAgentManager;

#[derive(Clone)]
struct PassSshAgent {}

impl PassSshAgent {}

#[async_trait::async_trait]
impl agent::server::Agent for PassSshAgent {
    fn confirm(
        self,
        _key: Arc<ssh_key::PrivateKey>,
    ) -> Box<dyn futures::future::Future<Output = (Self, bool)> + Send + Unpin> {
        println!("SSH agent confirming key usage");
        Box::new(futures::future::ready((self, true)))
    }

    async fn confirm_request(&self, _msg: agent::server::MessageType) -> bool {
        println!("SSH agent confirming request");
        true
    }
}

impl SshAgentManager {
    pub fn start_agent() -> Result<String> {
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

            let agent_handler = PassSshAgent {};

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
            // TODO: Windows implementation with named pipes
            return Err(anyhow::anyhow!("Windows SSH agent not implemented yet"));
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
        if !socket_path.exists() {
            return Err(anyhow::anyhow!("Socket file does not exist: {}", socket_path.display()));
        }

        println!("Connecting to SSH agent at: {}", socket_path.display());

        let mut client = match timeout(
            Duration::from_secs(10),
            agent::client::AgentClient::connect_uds(socket_path),
        )
        .await
        {
            Ok(Ok(client)) => {
                println!("Successfully connected to SSH agent");
                client
            }
            Ok(Err(e)) => return Err(anyhow::anyhow!("Failed to connect to SSH agent: {}", e)),
            Err(_) => return Err(anyhow::anyhow!("Timeout connecting to SSH agent")),
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

    async fn add_identity_to_agent(
        client: &mut russh_keys::agent::client::AgentClient<tokio::net::UnixStream>,
        key: &SshKeyData,
    ) -> Result<(), Error> {
        let private_key = Self::parse_private_key(&key.private_key)?;
        client.add_identity(&private_key, &[]).await?;
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
            // TODO
            Ok(PathBuf::from("\\\\.\\pipe\\pass-ssh-agent"))
        }
    }
}
