import { init } from '@proton/account/bootstrap';
import metrics from '@proton/metrics/metricsInstance';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { setSentryTags } from '@proton/shared/lib/helpers/sentry';

import { WEB_APP_VERSION } from './config';

export const initLumo = ({ config, ...options }: Parameters<typeof init>[0]) => {
    // Bootstrap initializes Sentry and the web updater. Both identify the original web build.
    // Let Sentry retain its normal production-release / development-commit selection.
    init({ ...options, config: { ...config, APP_VERSION: WEB_APP_VERSION } });

    // API callers and telemetry keep the combined config. Restore it for metrics and Sentry tags
    // after bootstrap, without reinitializing Sentry or changing its release.
    metrics.setVersionHeaders(getClientID(config.APP_NAME), config.APP_VERSION);
    setSentryTags({ appVersion: config.APP_VERSION });
};
