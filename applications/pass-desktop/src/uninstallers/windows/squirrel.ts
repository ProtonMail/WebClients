import { app } from 'electron';
import { spawn } from 'node:child_process';
import { appendFileSync, copyFileSync, existsSync, openSync } from 'node:fs';
import { resolve } from 'node:path';
import path from 'path';

import { squirrelLogger } from '../../utils/logger';
import { isWindows } from '../../utils/platform';

const getLogger =
    (logPath: string, scriptPath: string) =>
    (...data: unknown[]) => {
        const prefix = existsSync(scriptPath) ? '\n' : '';
        const date = new Date().toISOString();
        const message = data
            .join(' ')
            .split('\n')
            .filter((line) => line.trim().length)
            .map((chunk) => `[${date}] ${chunk}`)
            .join('\n');

        appendFileSync(logPath, `${prefix}${message}`, 'utf8');
    };

const spawnUninstallProcess = async () => {
    const logPath = resolve(app.getPath('temp'), 'proton-pass-uninstall.log');
    const scriptPath = resolve(app.getPath('temp'), 'proton-pass-uninstall.bat');
    const uninstallLogFileDescriptor = openSync(logPath, 'a');
    const uninstallScriptPath = resolve(process.resourcesPath, 'uninstall.bat');
    const logger = getLogger(logPath, scriptPath);

    logger(`Copying uninstall script "${uninstallScriptPath}" to "${scriptPath}"`);
    copyFileSync(uninstallScriptPath, scriptPath);

    const args = [
        process.pid.toString(),
        `"${resolve(app.getPath('home'), 'AppData', 'Local', 'ProtonPass')}"`,
        `"${resolve(app.getPath('home'), 'AppData', 'Roaming', 'Proton Pass')}"`,
        `"${scriptPath}"`,
    ];

    logger(`Spawing uninstall process: ${scriptPath} ${args.join(' ')}`);
    const uninstallProcess = spawn(scriptPath, args, {
        cwd: app.getPath('temp'),
        detached: true,
        shell: true,
        // Detach stdio from current process so we can run the process separately
        stdio: ['ignore', uninstallLogFileDescriptor, uninstallLogFileDescriptor],
        // Do not show shell window to users
        windowsHide: true,
        // Do not autoescape arguments
        windowsVerbatimArguments: true,
    });

    // Unlink the opened process from the electron app so we can close the application
    // and keep the uninstall script running.
    uninstallProcess.unref();

    // Now wait until the uninstall script kills the electron process
    // WARN: We need to create an unresolved promise here so the execution is blocked
    // until the uninstall script kills electron. We want to do this instead of manually
    // exiting with `app.quit()` or `app.exit()` to avoid any side effect.
    logger('Uninstall process started');
    await new Promise(() => {});
};

export const handleSquirrelEvents = async () => {
    const run = (args: string[], done: (args: any) => void) => {
        const updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
        spawn(updateExe, args, { detached: true }).on('close', done);
    };

    if (isWindows) {
        squirrelLogger.info('startup');
        const cmd = process.argv[1] ?? null;
        const target = path.basename(process.execPath);

        if (['--squirrel-install', '--squirrel-updated'].includes(cmd)) {
            squirrelLogger.info('creating shortcut');
            run(['--createShortcut=' + target], app.quit);
        }

        if ('--squirrel-uninstall' === cmd) {
            squirrelLogger.info('removing shortcut');
            run(['--removeShortcut=' + target], app.quit);
            await spawnUninstallProcess();
        }

        if ('--squirrel-obsolete' === cmd) app.quit();
    }
};
