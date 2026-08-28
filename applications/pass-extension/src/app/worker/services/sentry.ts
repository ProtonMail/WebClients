import { logger } from '@proton/pass/utils/logger';
import { wait } from '@proton/shared/lib/helpers/promise';
import sentry, { setSentryEnabled } from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import '../../../lib/polyfills/shim';
import { isRuntimeActive, isRuntimeStale } from '../../../lib/utils/runtime';
import config from '../../config';

export const createSentryService = () => {
    /** Disable sentry while service-worker is activating
     * to prevent premature error reporting */
    setSentryEnabled(false);

    wait(50)
        .then(() => {
            if (isRuntimeActive()) {
                setSentryEnabled(true);
                logger.info(`[Sentry] Sentry service enabled`);
            }
        })
        .catch(noop);

    sentry({
        config,
        sentryConfig: {
            host: new URL(config.API_URL).host,
            release: config.APP_VERSION,
            environment: `browser-pass::worker`,
        },
        setupIgnore: () => false,
        beforeSendIgnore: isRuntimeStale,
        denyUrls: [],
    });

    return { toggle: (enabled: boolean) => setSentryEnabled(enabled) };
};

export type SentryService = ReturnType<typeof createSentryService>;
