import { ipcMain } from 'electron';

import noop from '@proton/utils/noop';

import { clipboard } from '../../native';
import { store } from '../store';

export type StoreClipboardProperties = {
    timeoutMs?: number;
};

export const storeDefaults: StoreClipboardProperties = {
    timeoutMs: 15_000,
};

export const setupIpcHandlers = () => {
    let clipboardTimer: NodeJS.Timeout;

    ipcMain.handle('clipboard:setConfig', (_, config: StoreClipboardProperties) => {
        return store.set('clipboard', config);
    });

    ipcMain.handle('clipboard:getConfig', () => {
        return store.get('clipboard');
    });

    ipcMain.handle('clipboard:writeText', (_event, text) => {
        if (clipboardTimer !== undefined) clearTimeout(clipboardTimer);

        clipboard.writeText(text, true).catch(noop);

        const { timeoutMs } = store.get('clipboard') || {};

        if (!timeoutMs || timeoutMs <= 0) return;

        clipboardTimer = setTimeout(async () => {
            const currentText = await clipboard.read();
            if (currentText !== text) return;
            clipboard.writeText('', true).catch(noop);
        }, timeoutMs);
    });
};
