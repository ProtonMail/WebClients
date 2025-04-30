import { api } from '@proton/pass/lib/api/api';
import { logger } from '@proton/pass/utils/logger';
import { reportClientLaunch } from '@proton/shared/lib/desktop/reportClientLaunch';
import { setMetricsEnabled } from '@proton/shared/lib/helpers/metrics';

export default async () => {
    try {
        /*
         * Metrics need to be enabled to report the install source.
         * This should be reverted back to default (false) after the
         * install source has been reported.
         */
        setMetricsEnabled(true);

        const installSource = (await window.ctxBridge?.getInstallInfo()) ?? null;
        if (installSource !== null) await reportClientLaunch(installSource, 'pass', api);
        void window.ctxBridge?.setInstallSourceReported();
    } catch (err) {
        logger.warn('[ClientLaunch] Failed to report install', err);
    } finally {
        /*
         * Revert metrics reporting and let the app
         * re-enable it at a later point if allowed
         */
        setMetricsEnabled(false);
    }
};
