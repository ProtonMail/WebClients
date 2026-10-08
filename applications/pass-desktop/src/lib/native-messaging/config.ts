import { stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { isProdEnv, isWindows } from '../../utils/platform';

export const getHostLocation = (app: Electron.App) => {
    // Packaged Windows builds are MSIX: the host exe lives inside the protected
    // WindowsApps folder and can't be launched directly by the browser. The MSIX
    // manifest (AppxManifest.xml.in) declares a windows.appExecutionAlias that
    // plants a launchable stub here, stable across app updates. The browser
    // requires an absolute path, so register the alias.
    if (isWindows() && isProdEnv()) {
        return join(process.env.LOCALAPPDATA ?? '', 'Microsoft', 'WindowsApps', 'proton_pass_nm_host.exe');
    }

    return join(
        app.getAppPath(),
        isProdEnv() ? '../assets' : 'native/target/release',
        `proton_pass_nm_host${isWindows() ? '.exe' : ''}`
    );
};

// Firefox can't launch the appExecutionAlias stub (a 0-byte reparse point;
// Firefox stats the host path and rejects reparse points before launch). It
// needs a real exe, so on packaged Windows we register a copy placed outside the
// protected WindowsApps folder. Chromium keeps the alias.
export const getFirefoxHostLocation = (app: Electron.App) => {
    if (isWindows() && isProdEnv()) {
        return join(process.env.LOCALAPPDATA ?? '', 'Proton Pass', 'proton_pass_nm_host.exe');
    }

    return getHostLocation(app);
};

// In-package real host exe, used as the source for the Firefox copy-out.
export const getPackagedHostSource = (app: Electron.App) =>
    join(app.getAppPath(), '../assets', 'proton_pass_nm_host.exe');

export const getSockLocation = async (app: Electron.App) => {
    const name = 'proton_pass.sock';
    if (isWindows()) return join('\\\\?\\pipe', name);
    const sockLocation = join(app.getPath('sessionData'), name);

    try {
        await stat(sockLocation);
        await unlink(sockLocation);
    } catch {}

    return sockLocation;
};
