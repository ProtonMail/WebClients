export type MetricsApiStatusTypes = '4xx' | '5xx' | 'failure';

export default function observeApiError(error: any, metricObserver: (status: MetricsApiStatusTypes) => void) {
    if (!error) {
        return metricObserver('failure');
    }

    if (error.status >= 500) {
        return metricObserver('5xx');
    }

    if (error.status >= 400) {
        return metricObserver('4xx');
    }

    return metricObserver('failure');
}
