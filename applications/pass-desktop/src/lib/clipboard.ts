import { ipcMain } from 'electron';

import noop from '@proton/utils/noop';

import { clipboard } from '../../native';

export default () => {
    let clipboardTimer: NodeJS.Timeout;
    ipcMain.handle('clipboard:writeText', (_event, text) => {
        clipboard.writeText(text, true).catch(noop);

        if (clipboardTimer !== undefined) clearTimeout(clipboardTimer);

        clipboardTimer = setTimeout(async () => {
            const currentText = clipboard.read();
            if (currentText !== text) return;
            clipboard.writeText('', true).catch(noop);
        }, 10_000);
    });
};
