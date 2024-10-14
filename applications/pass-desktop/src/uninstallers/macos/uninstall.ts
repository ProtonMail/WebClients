import { spawn } from 'child_process';
import { join } from 'path';

export const uninstallProton = () => {
    const file = join(process.resourcesPath, 'uninstall.sh');
    spawn(file, { detached: true }).unref();
};
