import { stat, unlink } from 'node:fs/promises';
import { platform } from 'node:os';
import { join } from 'node:path';


export const getHostLocation = (app: Electron.App) => {
    return join(
        app.getAppPath(),
        process.env.NODE_ENV === 'development' ? 'native/target/release' : '../assets',
        `proton_pass_nm_host${platform() === 'win32' ? '.exe' : ''}`
    );
};

export const getSockLocation = async (app: Electron.App) => {
    const name = 'proton_pass.sock';
    if (platform() === 'win32') return join('\\\\?\\pipe', name);
    const sockLocation = join(app.getPath('sessionData'), name);

    try {
        await stat(sockLocation);
        await unlink(sockLocation);
    } catch {}

    return sockLocation;
};
