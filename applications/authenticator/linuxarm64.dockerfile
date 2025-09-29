FROM rust:1.90.0

RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    pkg-config \
    libgtk-3-dev \
    libwebkit2gtk-4.1-dev \
    libssl-dev \
    libgtk-3-0 \
    ca-certificates \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs
RUN node --version && npm --version
RUN corepack enable

WORKDIR /app

CMD ["/bin/bash", "-c", "yarn && cd applications/authenticator && NODE_ENV=production yarn tauri build --target aarch64-unknown-linux-gnu --features devtools"]

