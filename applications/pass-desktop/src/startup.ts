import { setupIpcHandlers as autotype } from './lib/autotype';
import biometrics from './lib/biometrics';
import { setupIpcHandlers as clipboard } from './lib/clipboard/clipboard.ipc';
import { setupIpcHandlers as info } from './lib/install-info';
import { setupIpcHandlers as navigation } from './lib/navigation';
import { setupIpcHandlers as theming } from './lib/theming';
import type { PassElectronContext } from './types';
import { handleSquirrelEvents } from './utils/squirrel';

export const startup = async (ctx: PassElectronContext) => {
    // Handle creating/removing shortcuts on Windows when installing/uninstalling.
    await handleSquirrelEvents();

    // Initialize IPC handlers
    biometrics(() => ctx.window);
    navigation(() => ctx.window);
    clipboard();
    info();
    theming();
    autotype(() => ctx.window);
};
