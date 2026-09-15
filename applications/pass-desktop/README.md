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

If you want to target prod, use this instead

```bash
yarn start:prod
```

On Linux, if you get a sandbox error, you'll need to disable Electron sandbox by doing:

```bash
ELECTRON_DISABLE_SANDBOX=1 yarn start
```

## Screen privacy

On Windows and macOS, **Settings > Security > Screen privacy** offers an optional setting to help prevent accidental exposure of the main Pass window in screenshots, screen recordings, and screen sharing. It is off by default, stored locally for this desktop installation, and reapplied before the main window is displayed. Changing it takes effect without restarting. `PASS_DEBUG` does not override the preference.

This is not a guarantee against capture:

- **Windows:** Electron uses `SetWindowDisplayAffinity`. Windows 10 version 2004 and later can exclude the window from capture; older versions capture a black window. Some capture tools may still capture its contents.
- **macOS:** apps using ScreenCaptureKit can still capture the window even when protection is enabled. The setting displays this limitation explicitly.
- **Linux:** Electron does not support this protection. The setting is hidden, and the main process rejects attempts to enable it.

See [Electron's content protection documentation](https://www.electronjs.org/docs/latest/api/browser-window#winsetcontentprotectionenable-macos-windows).

When validating a release, record the OS version and capture/sharing tools used:

1. Enable and disable the setting; verify each change takes effect immediately.
2. Enable it, quit the app completely, and relaunch; verify the preference and protection are restored. Also check hiding to the tray and reopening.
3. Check screenshots, screen recordings, and both window and whole-screen sharing on Windows. On macOS, check and document the ScreenCaptureKit limitation.
4. Confirm that Linux does not offer the setting.
5. If reading the preference fails, the control must remain disabled with an unknown state and an error message. If an update fails, the last confirmed value must remain displayed and an error notification must appear.

## Internal only

For Linux builds, you can add PassDesktop label on the MR and trigger the pipeline for linux builds
