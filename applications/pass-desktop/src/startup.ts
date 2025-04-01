import biometrics from './lib/biometrics';
import { setupIpcHandlers as clipboard } from './lib/clipboard';
import { setupIpcHandlers as info } from './lib/install-info';
import { setupIpcHandlers as navigation } from './lib/navigation';
import { setupIpcHandlers as theming } from './lib/theming';
import type { PassElectronContext } from './types';
import { installDaemon } from './uninstallers/macos/daemon';
import { handleSquirrelEvents } from './utils/squirrel';

export const startup = async (ctx: PassElectronContext) => {
    // Handle creating/removing shortcuts on Windows when installing/uninstalling.
    await handleSquirrelEvents();

    // Handle the creation of a Daemon to wipe data after manual deletion
    installDaemon();

    // Initialize IPC handlers
    biometrics(() => ctx.window);
    navigation(() => ctx.window);
    clipboard();
    info();
    theming();
};
