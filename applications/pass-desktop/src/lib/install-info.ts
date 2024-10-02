import { ipcMain } from 'electron';
import logger from 'electron-log/main';
import Store from 'electron-store';

const store = new Store<{
    installInfo?: {
        source: string | null;
        reported: boolean;
    };
}>({});

export function setInstallSource(installSource: string) {
    logger.info('set install source', installSource);
    store.set('installInfo', {
        source: installSource,
        reported: false,
    });
}

export function getInstallSource() {
    const installInfo = store.get('installInfo');

    if (installInfo?.reported === false) {
        logger.debug('get install source', installInfo.source);
        return installInfo.source;
    }

    return null;
}

export function setInstallSourceReported() {
    const installInfo = store.get('installInfo');

    if (installInfo && installInfo.reported === false) {
        logger.info('set install source as reported');
        store.set('installInfo', {
            source: installInfo.source,
            reported: true,
        });
    }
}

export function setupIpcHandlers() {
    const installSource = getInstallSource();
    ipcMain.handle('installInfo:getInfo', () => Promise.resolve({ installSource }));
    ipcMain.handle('installInfo:setInstallSourceReported', () => setInstallSourceReported());
}
