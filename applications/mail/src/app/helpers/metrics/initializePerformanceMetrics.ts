import { reportWebVitals } from '@proton/shared/lib/metrics/webvitals';

export const initializePerformanceMetrics = () => {
    if (process.env.NODE_ENV !== 'production') {
        return;
    }

    reportWebVitals();
};
