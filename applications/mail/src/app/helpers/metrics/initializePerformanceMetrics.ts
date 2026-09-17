import { reportWebVitals } from '@proton/metrics/webvitals';

export const initializePerformanceMetrics = () => {
    if (process.env.NODE_ENV !== 'production') {
        return;
    }

    reportWebVitals();
};
