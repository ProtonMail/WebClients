import type { CLSMetric, INPMetric, LCPMetric } from 'web-vitals';
import { onCLS, onINP, onLCP } from 'web-vitals';

import metrics from '@proton/metrics';

/*
 * Make sure you run this only once per react application
 * Ideally you can run it before doing ReactDOM.render()
 */

export const reportWebVitals = (context: 'public' | 'private' = 'private') => {
    const reportMetric = (metric: CLSMetric | INPMetric | LCPMetric) => {
        metrics.core_webvitals_total.increment({
            type: metric.name,
            rating: metric.rating,
            context,
        });
    };

    onCLS(reportMetric);
    onINP(reportMetric);
    onLCP(reportMetric);
};
