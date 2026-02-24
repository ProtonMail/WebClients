## Proton Pass desktop app

[Rustup](https://rustup.rs/) is needed to build Pass desktop app.

On Linux it's maybe necessary to install some libraries:

```bash
sudo apt-get install -y build-essential libxkbcommon-dev
```

Make sure the correct Rust target is set in `native/build.js` for your architecture:

- **x86_64:** `x86_64-unknown-linux-gnu` (or `x86_64-unknown-linux-musl`)
- **ARM64 (e.g. Parallels VM):** `aarch64-unknown-linux-gnu`

## Running the app

Install dependencies:

```bash
yarn install
```

Build the native Rust module (required on first run and after native code changes):

```bash
yarn build:native
```

Start the app in development mode, it'll target black environment:

```bash
yarn start
```

On Linux, if you get a sandbox error, you'll need to disable Electron sandbox by doing:

```bash
ELECTRON_DISABLE_SANDBOX=1 yarn start
```

## Internal only

For Linux builds, you can add PassDesktop label on the MR and trigger the pipeline for linux builds
