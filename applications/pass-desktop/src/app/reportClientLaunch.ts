import { api } from '@proton/pass/lib/api/api';
import { logger } from '@proton/pass/utils/logger';
import { reportClientLaunch } from '@proton/shared/lib/desktop/reportClientLaunch';

export default async () => {
    try {
        const { installSource = null } = (await window.ctxBridge?.getInstallInfo()) ?? {};
        await reportClientLaunch(installSource, 'pass', api);
        void window.ctxBridge?.setInstallSourceReported();
    } catch (err) {
        logger.warn('[ClientLaunch] Failed to report install', err);
    }
};
