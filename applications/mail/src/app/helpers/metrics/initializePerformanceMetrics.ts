import { reportWebVitals } from '@proton/shared/lib/metrics/webvitals';

import { ELDTMetricMarkStart } from 'proton-mail/metrics/useMailELDTMetric';

export const initializePerformanceMetrics = () => {
    // Used for the ELDT metric (Email List Display Time)
    performance.mark(ELDTMetricMarkStart);

    if (process.env.NODE_ENV !== 'production') {
        return;
    }

    reportWebVitals();
};
