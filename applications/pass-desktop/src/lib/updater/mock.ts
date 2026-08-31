import type { Session } from 'electron';

import { UpdateErrorType, UpdateStatus } from '@proton/pass/types/desktop';

import logger from '../../utils/logger';
import { getUpdateStore, setUpdateStore } from './store';

const PROGRESS_THROTTLE_MS = 100;

export const mockDownload = async (session: Session, url: string, newVersion: string): Promise<void> => {
    logger.log(`[Update] Mock download from real source url=${url}`);
    setUpdateStore({ status: UpdateStatus.Downloading, progress: 0, newVersion });

    try {
        if (getUpdateStore().mockDoDownloadError) throw new Error('Mock download error (mockDoDownloadError=true)');

        const response = await session.fetch(url);
        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

        const total = Number(response.headers.get('content-length')) || 0;
        const reader = response.body.getReader();
        let received = 0;
        let lastUpdate = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            received += value.length;
            const now = Date.now();
            if (total > 0 && now - lastUpdate >= PROGRESS_THROTTLE_MS) {
                lastUpdate = now;
                setUpdateStore({ progress: Math.floor((received / total) * 100) });
            }
        }

        setUpdateStore({ status: UpdateStatus.UpdateReady, progress: null });
    } catch (err) {
        logger.log('[Update] Mock download failed', err);
        setUpdateStore({ status: UpdateStatus.Error, errorType: UpdateErrorType.DownloadFailed, progress: null });
    }
};
