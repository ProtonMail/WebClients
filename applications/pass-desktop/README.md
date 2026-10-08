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
pnpm install
```

Build the native Rust module (required on first run and after native code changes):

```bash
pnpm run build:native
```

Start the app in development mode, it'll target black environment:

```bash
pnpm run start
```

If you want to target prod, use this instead

```bash
pnpm run start:prod
```

On Linux, if you get a sandbox error, you'll need to disable Electron sandbox by doing:

```bash
ELECTRON_DISABLE_SANDBOX=1 pnpm run start
```

## Debug mode

Packaged builds ship at `info` log level with DevTools and the developer menu hidden. Setting the `PASS_DEBUG` environment variable before launch flips all three: debug-level logging (`src/utils/logger.ts`), DevTools on the window (`src/main.ts`), and the **View → Toggle developer tools** menu entry (`src/menu-view/application-menu.ts`). It's read from the process environment, so the app must be started with the variable set.

**macOS** — launch the binary inside the bundle with the variable set:

```bash
PASS_DEBUG=1 "/Applications/Proton Pass.app/Contents/MacOS/Proton Pass"
```

**Linux**:

```bash
PASS_DEBUG=1 "/opt/Proton Pass/proton-pass"
```

**Windows (PowerShell)** — for a Squirrel install the exe is directly launchable, so a session-scoped variable is enough:

```powershell
$env:PASS_DEBUG = "1"
& "$env:LOCALAPPDATA\ProtonPass\Proton Pass.exe"
```

For an **MSIX** install the app is launched by the shell (Start menu / app alias), which doesn't inherit the PowerShell session environment. Set a persistent user-level variable, launch the app normally, then remove it afterwards:

```powershell
[Environment]::SetEnvironmentVariable("PASS_DEBUG", "1", "User")
# launch Proton Pass from the Start menu, then once done:
[Environment]::SetEnvironmentVariable("PASS_DEBUG", $null, "User")
```

## Filesystem locations

Reference for testing/debugging where the desktop app, its logs, and the native messaging host (used by the extension biometric/desktop unlock) live on each OS. The Electron `productName` is `Proton Pass` (with a space); `dirs::data_local_dir()` in the Rust host and Electron's `appData`/`logs` paths produce the folders below.

### Install location

| OS                         | Path                                                             |
| -------------------------- | ---------------------------------------------------------------- |
| macOS                      | `/Applications/Proton Pass.app`                                  |
| Windows (MSIX, current)    | `C:\Program Files\WindowsApps\ProtonPass_<version>_x64__<hash>\` |
| Windows (Squirrel, legacy) | `%LOCALAPPDATA%\ProtonPass\`                                     |
| Linux (deb/rpm)            | `/opt/Proton Pass/`                                              |

### Logs

Two distinct log streams. The Electron "backend" log is written via `electron-log` (`src/utils/logger.ts`); reach it from the app menu (**Help → Open logs**, which calls `shell.openPath(app.getPath('logs'))`). The Rust native-messaging host writes its own log via `ftail`, rooted at `dirs::data_local_dir()/Proton Pass/` (`native/host/src/main.rs`).

**Electron app logs** (`app.getPath('logs')`, `main.log`):

| OS      | Path                                  |
| ------- | ------------------------------------- |
| macOS   | `~/Library/Logs/Proton Pass/main.log` |
| Windows | `%APPDATA%\Proton Pass\logs\main.log` |
| Linux   | `~/.config/Proton Pass/logs/main.log` |

**Rust native-messaging host log** (`proton_pass_nm_host.log`, rotated to `.old`):

| OS | Path |
| --- | --- |
| macOS | `~/Library/Application Support/Proton Pass/proton_pass_nm_host.log` |
| Windows | `%LOCALAPPDATA%\Proton Pass\proton_pass_nm_host.log` |
| Windows (MSIX container redirect) | `%LOCALAPPDATA%\Packages\<PackageFamilyName>\LocalCache\Local\Proton Pass\proton_pass_nm_host.log` |
| Linux | `~/.local/share/Proton Pass/proton_pass_nm_host.log` |

> On Windows the host runs **inside the MSIX package container** (launched via the appExecutionAlias), so `data_local_dir()` is redirected under `%LOCALAPPDATA%\Packages\...` rather than the bare `%LOCALAPPDATA%\Proton Pass`. This also explains the `ProtonPass` (Electron userData, no space) vs `Proton Pass` (host, with space) split.

### Native messaging

The host registration is done at app launch by the Rust `install()` (host name `me.proton.pass.nm`, **user scope**), wired in `native/shared/src/nm_install.rs`. The host binary path is computed by `src/lib/native-messaging/config.ts` (`getHostLocation`).

**Host binary** (`proton_pass_nm_host` / `.exe`):

| Context | Path |
| --- | --- |
| Dev (`yarn start`) | `<appPath>/native/target/release/proton_pass_nm_host[.exe]` |
| Packaged macOS/Linux | `<app resources>/assets/proton_pass_nm_host` |
| Packaged Windows (MSIX) | registered alias `%LOCALAPPDATA%\Microsoft\WindowsApps\proton_pass_nm_host.exe`; real exe at `...\WindowsApps\ProtonPass_<version>_x64__<hash>\app\resources\assets\proton_pass_nm_host.exe` |

**Manifest registration.** On macOS/Linux a JSON manifest file (`me.proton.pass.nm.json`) is written per browser. On Windows the same JSON file is written **and** a registry key under `HKCU` points to it. Directories below are the user-scope locations (from the `native_messaging` crate's `browsers.toml`):

| Browser | macOS (`~/Library/Application Support/...`) | Linux (`~/...`) | Windows manifest dir | Windows registry key (HKCU) |
| --- | --- | --- | --- | --- |
| Chrome | `Google/Chrome/NativeMessagingHosts` | `.config/google-chrome/NativeMessagingHosts` | `%LOCALAPPDATA%\NativeMessagingHosts` | `Software\Google\Chrome\NativeMessagingHosts\me.proton.pass.nm` |
| Chromium | `Chromium/NativeMessagingHosts` | `.config/chromium/NativeMessagingHosts` | `%LOCALAPPDATA%\NativeMessagingHosts` | `Software\Chromium\NativeMessagingHosts\me.proton.pass.nm` |
| Edge | `Microsoft Edge/NativeMessagingHosts` | `.config/microsoft-edge/NativeMessagingHosts` | `%LOCALAPPDATA%\NativeMessagingHosts` | `Software\Microsoft\Edge\NativeMessagingHosts\me.proton.pass.nm` |
| Brave | `BraveSoftware/Brave-Browser/NativeMessagingHosts` | `.config/BraveSoftware/Brave-Browser/NativeMessagingHosts` | `%LOCALAPPDATA%\NativeMessagingHosts` | `Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\me.proton.pass.nm` |
| Vivaldi | `Vivaldi/NativeMessagingHosts` | `.config/vivaldi/NativeMessagingHosts` | `%LOCALAPPDATA%\NativeMessagingHosts` | `Software\Vivaldi\NativeMessagingHosts\me.proton.pass.nm` |
| Firefox | `Mozilla/NativeMessagingHosts` | `.mozilla/native-messaging-hosts` | `%APPDATA%\Mozilla\NativeMessagingHosts` | `Software\Mozilla\NativeMessagingHosts\me.proton.pass.nm` |
| LibreWolf | `LibreWolf/NativeMessagingHosts` | `.librewolf/native-messaging-hosts` | `%APPDATA%\LibreWolf\NativeMessagingHosts` | `Software\Mozilla\NativeMessagingHosts\me.proton.pass.nm` |

> Allow-listed extension IDs (Chrome/Edge `allowed_origins` + Firefox `allowed_extensions`) are defined in `native/shared/src/nm_install.rs`.

**Host ↔ desktop transport** (`getSockLocation`, `src/lib/native-messaging/config.ts`):

| OS            | Path                                            |
| ------------- | ----------------------------------------------- |
| macOS / Linux | unix socket at `<sessionData>/proton_pass.sock` |
| Windows       | named pipe `\\?\pipe\proton_pass.sock`          |

## Internal only

For Linux builds, you can add PassDesktop label on the MR and trigger the pipeline for linux builds
