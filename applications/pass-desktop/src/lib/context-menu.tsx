import { type BrowserWindow, Menu, MenuItem, ipcMain } from 'electron';

import type { ContextMenuItem } from '@proton/pass/types/desktop';
import type { MaybeNull } from '@proton/pass/types/utils';

export default (getWindow: () => MaybeNull<BrowserWindow>) => {
    ipcMain.handle('contextMenu:open', (_, options: { items: ContextMenuItem[] }) => {
        const window = getWindow() || undefined;

        return new Promise((resolve) => {
            const menu = new Menu();

            options.items.forEach(({ label, type, role }, index) => {
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
