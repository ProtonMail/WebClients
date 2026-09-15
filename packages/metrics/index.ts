import { SECOND } from '@proton/shared/lib/constants';
import type { SharedMetricsClient } from '@proton/shared/lib/metrics/sharedMetricsClient';
import { setSharedMetricsClient } from '@proton/shared/lib/metrics/sharedMetricsClient';

import Metrics from './Metrics';
import { METRICS_BATCH_SIZE, METRICS_REQUEST_FREQUENCY_SECONDS } from './constants';
import MetricsApi from './lib/MetricsApi';
import MetricsRequestService from './lib/MetricsRequestService';

export * from './lib/observeApiError';
export { default as observeApiError } from './lib/observeApiError';

const metricsApi = new MetricsApi();
const metricsRequestService = new MetricsRequestService(metricsApi, {
    reportMetrics: true,
    batch: {
        frequency: METRICS_REQUEST_FREQUENCY_SECONDS * SECOND,
        size: METRICS_BATCH_SIZE,
    },
});
const metrics = new Metrics(metricsRequestService);

setSharedMetricsClient(metrics as unknown as SharedMetricsClient);

export default metrics;
