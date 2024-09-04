import { app } from 'electron';
import Logger from 'electron-log';
import minimist from 'minimist';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

export const squirrelLogger = Logger.scope('squirrel');
export const SQUIRREL_INSTALL = '--squirrel-install';
export const SQUIRREL_UPDATED = '--squirrel-updated';
export const SQUIRREL_UNINSTALL = '--squirrel-uninstall';
export const SQUIRREL_OBSOLETE = '--squirrel-obsolete';

// Copied from `electron-squirrel-startup` and change
function runSquirrelShortcut(locations: string, remove: boolean) {
    const target = basename(process.execPath);
    const action = remove ? 'removeShortcut' : 'createShortcut';
    const args = [`--${action}=${target}`, `--shortcut-locations=${locations}`];
    const updateExe = resolve(dirname(process.execPath), '..', 'Update.exe');

    squirrelLogger.debug(`Spawning "${updateExe}" with args:`, args);
    spawn(updateExe, args, {
        detached: true,
    }).on('close', app.quit);
}

type InstallArgs = {
    isSilent: boolean;
    isAutoLaunch: boolean;
    source: string;
    wantDesktopShortcut: boolean;
};

export function parseInstallArguments(lastArgs: string[]): InstallArgs {
    const args = minimist(lastArgs);
    squirrelLogger.log('Parsed args:', args);

    return {
        isSilent: args.s || args.silent === 1 || args.silent === true,
        isAutoLaunch: args['auto-launch'] !== 0,
        source: args.source,
        wantDesktopShortcut: args['desktop-shortcut'] !== 0,
    };
}

// Copied from `electron-squirrel-startup` and change
export function isSquirrelStartup() {
    if (process.platform !== 'win32') {
        return false;
    }

    if (process.argv.length < 2) {
        return false;
    }

    const cmd = process.argv[1];
    squirrelLogger.debug(`Checking for squirrel command "${cmd}"`);

    if (cmd === SQUIRREL_INSTALL || cmd === SQUIRREL_UPDATED || cmd === SQUIRREL_UNINSTALL) {
        return true;
    }

    if (cmd === SQUIRREL_OBSOLETE) {
        app.quit();
        return true;
    }

    return false;
}

export async function handleInstallShortcuts() {
    const args = parseInstallArguments(process.argv);
    squirrelLogger.log('Instal args', args);

    // do not install desktop shortcut if not requested
    runSquirrelShortcut(args.wantDesktopShortcut ? 'Desktop,StartMenu' : 'StartMenu', false);
}

export function handleUpdatedShortcuts() {
    const hasDesktopShortcut = existsSync(
        resolve(app.getPath('desktop'), basename(process.execPath).replace('.exe', '.lnk'))
    );

    runSquirrelShortcut(hasDesktopShortcut ? 'Desktop,StartMenu' : 'StartMenu', false);
}

export function handleUninstallShortcuts() {
    runSquirrelShortcut('Desktop,StartMenu', true);
}
