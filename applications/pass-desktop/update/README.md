# Local update server

A static mirror of the production update server (`https://proton.me/download/PassDesktop/...`) for testing the desktop auto-update flow end-to-end without shipping a real release.

It serves the same `version.json` / `RELEASES.json` manifests as prod. The app is redirected here at runtime via the `baseUrl` debug override, so the **real** install path runs (native MSIX on Windows, `autoUpdater` on Mac) — not the mock.

## Layout

```
update/
  PassDesktop/
    darwin/universal/   version.json + RELEASES.json   (+ .zip artifact)
    win32/x64/          version.json                    (+ .msix artifact)
    linux/x64/          .gitkeep                         (+ .deb artifact)
```

This mirrors what the app fetches: `{platform}/{arch}` where `arch` is `universal` on Mac and `process.arch` on Windows. Mac additionally needs `RELEASES.json` (the Electron `autoUpdater` feed); Windows installs straight from the `File[].Url` in `version.json`.

Linux has **no auto-update system** (the updater excludes it), so it carries no `version.json` — its folder exists only for layout symmetry and as a drop point for the manually-downloaded `.deb`.

## Artifacts

The manifests are committed; the release packages are **not** (too heavy — see `.gitignore`). Drop CI-built **signed** artifacts into the matching folder by hand. The OS installers reject anything unsigned or improperly signed, so locally-built unsigned packages will fail at the install step.

Filenames must match the manifest URLs:

- Windows: `ProtonPass_<version>.msix` (the build's `postMake` hook strips the `_Setup_` infix the MSIX maker adds; `_Setup_` only applies to the legacy `<1.38` `.exe`)
- Mac: `Proton Pass-darwin-universal-<version>.zip`

> **macOS — rewrite `RELEASES.json`'s download URL.** The build generates `RELEASES.json` with `updateTo.url` pointing at prod (`MakerZIP`'s `macUpdateManifestBaseUrl` in `forge.config.ts`). The `baseUrl` override only redirects the _feed_ fetch, not the absolute URL inside it — so if you copy a generated/real `RELEASES.json`, you must rewrite `updateTo.url` (and set `currentRelease` to the release version) to point at `https://download.proton.dev:8099/...`, or Squirrel downloads from prod and fails with "the server sent an invalid response".

## Run the server

```sh
yarn workspace proton-pass-desktop update:serve
```

Serves this folder on port `8099` with caching disabled (`-c-1`), so edited manifests are picked up immediately. The launcher auto-detects TLS:

- **HTTPS on `https://download.proton.dev:8099`** if the [`utilities/local-sso`](../../../utilities/local-sso) wildcard cert exists — **required for the macOS install step** (Squirrel.Mac enforces App Transport Security, which rejects plain HTTP).
- **HTTP on `http://localhost:8099`** otherwise — or pass `--http` to force HTTP even when the cert exists. Fine for the Windows MSIX install, which has no ATS constraint.

### macOS prerequisites (HTTPS)

The cert is reused from local-sso rather than generated here:

1. Run local-sso's cert setup once (installs the trusted mkcert CA and generates `_wildcard.proton.dev.pem`):
    ```sh
    cd utilities/local-sso && ./generate-certificate.sh
    ```
2. Map the update host to localhost — add to `/etc/hosts`:
    ```
    127.0.0.1 download.proton.dev
    ```

### Windows from a VM (HTTP, no cert)

The MSIX install has no ATS constraint, so skip HTTPS — serve plain HTTP and let the guest reach the host directly by IP. No hostname, cert, or CA import needed.

```sh
yarn workspace proton-pass-desktop update:serve --http
```

`http-server` binds all interfaces, so the VM reaches it at the **host's IP** (here `192.168.1.21`, which depends on the VM network mode — bridged → host LAN IP; NAT → the host-only gateway IP). Then:

1. In the VM's devtools console, set the base URL to the host:
    ```js
    await window.ctxBridge.setUpdateStore({ mockUpdateBaseUrl: 'http://192.168.1.21:8099/', mockDownload: false });
    await window.ctxBridge.checkForUpdates();
    ```
2. Edit `PassDesktop/win32/x64/version.json`'s `File[].Url` to the same `http://192.168.1.21:8099/...` — it's absolute, so the `baseUrl` override doesn't rewrite it.
3. Allow inbound `8099` through the host firewall.

(Alternatively keep the `download.proton.dev` hostname and map it to the host IP in the VM's `hosts` file — stable fixture, but more setup than raw IP.)

## Point the app at it

Launch the installed app with `PASS_DEBUG=1` (the override is ignored in prod builds without it).

**macOS** (installed from the `.dmg`) — env var inherited from the shell:

```sh
PASS_DEBUG=1 /Applications/Proton\ Pass.app/Contents/MacOS/Proton\ Pass
```

**Windows** (installed from the `.msix`) — an MSIX app is launched via _activation_ and does **not** inherit a console's env vars, so set `PASS_DEBUG` at the user level first, then launch normally (PowerShell):

```powershell
[Environment]::SetEnvironmentVariable('PASS_DEBUG', '1', 'User')
Stop-Process -Name explorer -Force   # so app activation picks up the new env (or sign out/in)
$app = Get-StartApps | Where-Object Name -like '*Proton Pass*'
Start-Process "shell:AppsFolder\$($app.AppID)"
# cleanup when done: [Environment]::SetEnvironmentVariable('PASS_DEBUG', $null, 'User')
```

Then in the renderer devtools console, set the override for your platform and trigger a check:

`baseUrl` is just the server root — the updater appends the `PassDesktop/{platform}/{arch}` path for the running platform.

```js
// macOS
await window.ctxBridge.setUpdateStore({ mockUpdateBaseUrl: 'https://download.proton.dev:8099/', mockDownload: false });
// Windows x64
await window.ctxBridge.setUpdateStore({ mockUpdateBaseUrl: 'http://localhost:8099/', mockDownload: false });

await window.ctxBridge.checkForUpdates(); // download
await window.ctxBridge.restartToUpdate(); // install + relaunch
```

The override and `mockDownload` are reset on every boot, so re-set them each session. Use the Settings "Check now" / "Restart to update" buttons instead of the console if you prefer.

## Notes & gotchas

- **Version must be higher than the installed build**, or the manifest is treated as "no update". The fixtures use `9.9.9` so they always trigger; edit `Version` (and the artifact filenames) to test specific upgrades.
- **Rollout**: fixtures use `RolloutPercentage: 1.0` so the update always appears. Lower values gate on a stable per-install hash and may hide it.
- **Beta channel**: to test it, add a `beta/` subfolder under the platform dir with its own `version.json` (+ `RELEASES.json` on Mac), and set `{ beta: true }` in the store. The app appends `/beta` to the feed URL.
- **macOS needs HTTPS** (handled by the local-sso cert above): Squirrel.Mac enforces App Transport Security and rejects a plain-HTTP feed. The `version.json` check itself goes through Electron's net stack (not ATS) so it would tolerate HTTP, but `RELEASES.json` + the `.zip` download go through `autoUpdater`/`NSURLSession` and require the trusted-cert HTTPS server.
- **Use the `download.proton.dev` hostname, not `127.0.0.1`**: ATS allows the former with a trusted cert; the latter is treated as arbitrary networking.

## Possible second iteration: dynamic server

Today the manifests are hand-maintained, which is where most of the footguns live — the `RELEASES.json` URL rewrite, the `currentRelease`/`Version` matching, and the exact artifact filename. A future iteration could make the server **dynamic**: the tester just drops signed packages into a single flat `PassDesktop/` folder and the server generates everything else on the fly.

On each request it would scan that folder and infer **platform/arch from the file extension** (`.msix` → `win32/x64`, `.zip` → `darwin/universal`, `.deb`/`.rpm` → `linux/x64` — there's one arch per platform here, so the extension is enough), derive `Version` from the filename, and synthesize `version.json` (and the macOS `RELEASES.json`) with the correct **local** URLs, computed `Sha512CheckSum`, and a `currentRelease` matching the newest dropped package. That removes the three manual steps above entirely — drop-and-go, no per-platform folders to create.

Deferred for now; the static server is enough to validate the flow. Noted here so the idea isn't lost.
