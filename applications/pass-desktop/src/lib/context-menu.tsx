import type { BrowserWindow, MenuItemConstructorOptions } from 'electron';
import { Menu, MenuItem } from 'electron';

import type { ContextMenuItemSerializable } from '@proton/pass/types/desktop/context-menu';
import type { MaybeNull } from '@proton/pass/types/utils';

import { setupIpcHandler } from './ipc';

declare module 'proton-pass-desktop/lib/ipc' {
    interface IPCChannels {
        'contextMenu:open': IPCChannel<[items: ContextMenuItemSerializable[]], number>;
    }
}

declare module '@proton/pass/types/desktop/context-menu' {
    interface ContextMenuItem {
        role?: MenuItemConstructorOptions['role'];
        type?: MenuItemConstructorOptions['type'];
    }
}

export default (getWindow: () => MaybeNull<BrowserWindow>) => {
    setupIpcHandler('contextMenu:open', (_, items) => {
        const window = getWindow() || undefined;

        return new Promise<number>((resolve) => {
            const menu = new Menu();

            items.forEach(({ label, type, role }, index) => {
                menu.append(
                    new MenuItem({
                        label,
                        type,
                        click: () => resolve(index),
                        role,
                    })
                );
            });

            menu.popup({
                window,
                callback: () => {
                    resolve(-1);
                },
            });
        });
    });
};
