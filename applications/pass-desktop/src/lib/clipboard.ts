import type { ClipboardStoreProperties } from '@proton/pass/types/desktop';
import noop from '@proton/utils/noop';

import { clipboard } from '../../native';
import { store } from '../store';
import { setupIpcHandler } from './ipc';

export const setupIpcHandlers = () => {
    let clipboardTimer: NodeJS.Timeout;

    setupIpcHandler('clipboard:setConfig', (_, config: ClipboardStoreProperties) => store.set('clipboard', config));
    setupIpcHandler('clipboard:getConfig', () => store.get('clipboard'));

    setupIpcHandler('clipboard:writeText', (_event, text) => {
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
