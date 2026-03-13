import { setupIpcHandlers as autotype } from './lib/autotype';
import biometrics from './lib/biometrics';
import { setupIpcHandlers as clipboard } from './lib/clipboard/clipboard.ipc';
import contextMenu from './lib/context-menu';
import { setupIpcHandlers as info } from './lib/install-info';
import { nativeMessaging } from './lib/native-messaging/startup';
import { setupIpcHandlers as navigation } from './lib/navigation';
import { setupIpcHandlers as theming } from './lib/theming';
import { setupIpcHandlers as update } from './lib/update';
import { setupIpcHandlers as window } from './lib/window';
import type { PassElectronContext } from './types';
import { handleSquirrelEvents } from './utils/squirrel';

export const startup = async (app: Electron.App, ctx: PassElectronContext) => {
    // Handle creating/removing shortcuts on Windows when installing/uninstalling.
    await handleSquirrelEvents();

    // Initialize IPC handlers
    window(() => ctx.window);
    biometrics(() => ctx.window);
    navigation(() => ctx.window);
    clipboard();
    info();
    theming();
    autotype(() => ctx.window);
    contextMenu(() => ctx.window);
    update(() => ctx.session);
    const shutdownNativeMessaging = await nativeMessaging(app, () => ctx.window);

    // Return cleanup function
    return async () => {
        await shutdownNativeMessaging();
    };
};
