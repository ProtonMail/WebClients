FROM rust:1.97.1

RUN apt-get update && apt-get install -y --no-install-recommends \
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

RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*
RUN node --version && npm --version
# Run the build as a non-root user. Override the IDs to match the host user
# when bind-mounting the repo on Linux (e.g. --build-arg UID=$(id -u)).
ARG UID=1000
ARG GID=1000
RUN (getent group "${GID}" || groupadd --gid "${GID}" builder) \
    && useradd --uid "${UID}" --gid "${GID}" --create-home --shell /bin/bash builder \
    && mkdir -p /app \
    && chown -R "${UID}:${GID}" /app /usr/local/cargo

USER builder
WORKDIR /app

# The build context is this application, not the repo root, so pnpm is installed at run time from
# the bind-mounted repo, with the version pinned by packageManager. npm's global prefix is moved
# to the home of the non-root user.
ENV NPM_CONFIG_PREFIX=/home/builder/.npm-global
ENV PATH="${NPM_CONFIG_PREFIX}/bin:${PATH}"

CMD ["/bin/bash", "-c", "ci/bin/install-pnpm.sh && pnpm install --frozen-lockfile && cd applications/authenticator && NODE_ENV=production pnpm exec tauri build --target aarch64-unknown-linux-gnu --features devtools"]

