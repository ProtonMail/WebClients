import { SECOND } from '@proton/shared/lib/constants';

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

export default metrics;
