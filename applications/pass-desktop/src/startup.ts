import biometrics from './lib/biometrics';
import clipboard from './lib/clipboard';
import { setupIpcHandlers as info } from './lib/install-info';
import type { PassElectronContext } from './types';
import { handleSquirrelEvents } from './utils/squirrel';

export const startup = async (ctx: PassElectronContext) => {
    // Handle creating/removing shortcuts on Windows when installing/uninstalling.
    await handleSquirrelEvents();

    // Initialize IPC handlers
    biometrics(() => ctx.window);
    clipboard();
    info();
};
