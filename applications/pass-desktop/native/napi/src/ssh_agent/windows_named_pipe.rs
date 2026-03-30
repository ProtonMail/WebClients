use tokio::net::windows::named_pipe::NamedPipeServer;
use tokio_util::sync::CancellationToken;

pub struct NamedPipeListener {
    rx: tokio::sync::mpsc::Receiver<std::io::Result<NamedPipeServer>>,
    pub cancel_token: CancellationToken,
}

impl NamedPipeListener {
    pub fn new(path: String) -> std::io::Result<Self> {
        use tokio::net::windows::named_pipe::ServerOptions;

        let (tx, rx) = tokio::sync::mpsc::channel(10);
        let cancel_token = CancellationToken::new();
        let cancel_clone = cancel_token.clone();
        let mut listener = ServerOptions::new().first_pipe_instance(true).create(&path)?;

        tokio::spawn(async move {
            loop {
                tokio::select! {
                    _ = cancel_clone.cancelled() => {
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

impl futures::stream::Stream for NamedPipeListener {
    type Item = std::io::Result<NamedPipeServer>;

    fn poll_next(mut self: std::pin::Pin<&mut Self>, cx: &mut std::task::Context<'_>) -> std::task::Poll<Option<Self::Item>> {
        self.rx.poll_recv(cx)
    }
}
