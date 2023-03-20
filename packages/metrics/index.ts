import { SECOND } from '@proton/shared/lib/constants';

import { METRICS_BATCH_SIZE, METRICS_REQUEST_FREQUENCY_SECONDS } from './constants';
import MetricsApi from './lib/MetricsApi';
import MetricsBase from './lib/MetricsBase';
import MetricsRequestService from './lib/MetricsRequestService';

class Metrics extends MetricsBase {}

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
