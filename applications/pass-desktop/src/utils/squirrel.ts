import { app } from 'electron';

import {
    SQUIRREL_INSTALL,
    SQUIRREL_OBSOLETE,
    SQUIRREL_UNINSTALL,
    SQUIRREL_UPDATED,
    handleInstallShortcuts,
    handleUninstallShortcuts,
    handleUpdatedShortcuts,
    isSquirrelStartup,
    squirrelLogger,
} from '@proton/shared/lib/squirrel/squirrel';

import { spawnUninstallProcess } from '../uninstallers/windows/squirrel';

export async function handleSquirrelEvents() {
    if (!isSquirrelStartup()) return;

    squirrelLogger.info('Startup');

    const squirrelCommand = process.argv[1] ?? null;

    switch (squirrelCommand) {
        case SQUIRREL_INSTALL:
            squirrelLogger.info('Install:', process.argv);
            await handleInstallShortcuts();
            break;
        case SQUIRREL_UPDATED:
            squirrelLogger.info('Updated:', process.argv);
            // During update the path to exe can change. Therefore we want to
            // update the lnk if they exists.
            await handleUpdatedShortcuts();
            break;
        case SQUIRREL_UNINSTALL: {
            squirrelLogger.info('Uninstall:', process.argv);
            await handleUninstallShortcuts();
            await spawnUninstallProcess();
            break;
        }
        case SQUIRREL_OBSOLETE:
            squirrelLogger.info('Obsolete:', process.argv);
            break;
    }

    // WARN: App quit gracefully stops all electron processes asynchronously,
    // so unless we block the execution before this point (like we do during the
    // uninstall process) the app startup will continue.
    app.quit();
}
