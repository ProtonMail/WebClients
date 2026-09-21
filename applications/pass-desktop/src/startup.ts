import { setupIpcHandlers as autotype } from './lib/autotype';
import biometrics from './lib/biometrics';
import { setupIpcHandlers as client } from './lib/client';
import { setupIpcHandlers as clipboard } from './lib/clipboard/clipboard.ipc';
import { setupIpcHandlers as contentProtection } from './lib/content-protection';
import contextMenu from './lib/context-menu';
import { setupIpcHandlers as info } from './lib/install-info';
import { nativeMessaging } from './lib/native-messaging/startup';
import { setupIpcHandlers as navigation } from './lib/navigation';
import { setupIpcHandlers as sshAgent } from './lib/ssh-agent';
import { setupIpcHandlers as sessionStorage } from './lib/storage/storage.ipc';
import { system } from './lib/system';
import { setupIpcHandlers as theming } from './lib/theming';
import { setupIpcHandlers as update } from './lib/updater/ipc';
import { setupIpcHandlers as window } from './lib/window';
import type { PassElectronContext } from './types';
import { handleSquirrelEvents } from './utils/squirrel';

export const startup = async (app: Electron.App, ctx: PassElectronContext) => {
    // Handle creating/removing shortcuts on Windows when installing/uninstalling.
    await handleSquirrelEvents();

    // Initialize IPC handlers
    window(() => ctx.window);
    system(() => ctx.window);
    biometrics(() => ctx.window);
    navigation(() => ctx.window);
    sessionStorage(() => ctx.session);
    client();
    clipboard();
    contentProtection(() => ctx.window);
    info();
    theming();
    autotype(() => ctx.window);
    contextMenu(() => ctx.window);
    sshAgent(() => ctx.window);
    update(
        () => ctx.window,
        () => ctx.session
    );

    const shutdownNativeMessaging = await nativeMessaging(app, () => ctx.window);

    // Return cleanup function
    return async () => {
        await shutdownNativeMessaging();
    };
};
