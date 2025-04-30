import type { MaybeNull } from '@proton/pass/types';

import { store } from '../store';
import logger from '../utils/logger';
import { setupIpcHandler } from './ipc';

declare module 'proton-pass-desktop/lib/ipc' {
    interface IPCChannels {
        'installInfo:getInfo': IPCChannel<[], MaybeNull<string>>;
        'installInfo:setInstallSourceReported': IPCChannel<[], void>;
    }
}

export type StoreInstallProperties = {
    source: string | null;
    reported: boolean;
};

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
    setupIpcHandler('installInfo:getInfo', () => installSource);
    setupIpcHandler('installInfo:setInstallSourceReported', () => setInstallSourceReported());
}
