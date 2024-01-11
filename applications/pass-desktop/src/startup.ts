import { spawn } from 'child_process';
import { app } from 'electron';
import path from 'path';

const run = (args: string[], done: (args: any) => void) => {
    var updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
    spawn(updateExe, args, { detached: true }).on('close', done);
};

export const isSquirrelStartup = () => {
    if (process.platform === 'win32') {
        const cmd = process.argv[1];
        const target = path.basename(process.execPath);

        if (cmd === '--squirrel-install' || cmd === '--squirrel-updated') {
            run(['--createShortcut=' + target + ''], app.quit);
            return true;
        }

        if (cmd === '--squirrel-uninstall') {
            run(['--removeShortcut=' + target + ''], app.quit);
            return true;
        }

        if (cmd === '--squirrel-obsolete') {
            app.quit();
            return true;
        }
    }
    return false;
};
