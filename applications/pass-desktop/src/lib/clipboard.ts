import { clipboard, ipcMain } from 'electron';

export default () => {
    let clipboardTimer: NodeJS.Timeout;
    ipcMain.handle('clipboard:writeText', (_event, text) => {
        clearTimeout(clipboardTimer);
        clipboard.writeText(text);
        clipboardTimer = setTimeout(clipboard.clear, 30_000);
    });
};
