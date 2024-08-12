import { exec } from 'child_process';
import { app } from 'electron';
import { join } from 'path';

export const uninstallProton = () => {
    app.quit();

    const file = join(process.resourcesPath, 'uninstall.sh');

    exec(`sh "${file}"`);
};
