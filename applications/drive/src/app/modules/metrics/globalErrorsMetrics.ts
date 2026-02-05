import type { MetricEvent } from '@proton/drive';
import metrics from '@proton/metrics';
import { traceError } from '@proton/shared/lib/helpers/sentry';

import { logging } from '../logging';
import type { MetricUserPlanProvider } from './types';

const logger = logging.getLogger('globalErrorsMetrics');

const FIVE_MINUTES_IN_MILLISECONDS = 5 * 60 * 1000;

type ErrorType = 'coreFeatureError' | 'crashError' | 'otherError';

/**
 * GlobalErrorMetrics provides an interface for tracking global error metrics.
 *
 * Report following errors using this class:
 *
 * * Track crash errors (when application crashed and user had to refresh the page)
 * * Track core feature errors (e.g., upload or download failed, or during decryption error)
 * * Track other errors (e.g., any error that is reported to Sentry)
 *
 * This class automatically reports any unhandled error.
 */
export class GlobalErrorsMetrics {
    // Track which error types occurred in the current interval
    private errorMarks: Map<ErrorType, number> = new Map();

    private intervalId?: ReturnType<typeof setInterval>;
    private errorHandler?: () => void;
    private beforeUnloadHandler?: () => void;

    constructor(private userPlanProvider: MetricUserPlanProvider) {}

    init() {
        this.intervalId = setInterval(() => {
            void this.sendPeriodicReport();
        }, FIVE_MINUTES_IN_MILLISECONDS);

        this.errorHandler = () => {
            this.markOtherError();
        };
        this.beforeUnloadHandler = () => {
            void this.sendPeriodicReport();
        };

        window.addEventListener('error', this.errorHandler);
        window.addEventListener('beforeunload', this.beforeUnloadHandler);
    }

    destroy() {
        clearInterval(this.intervalId);
        if (this.errorHandler) {
            window.removeEventListener('error', this.errorHandler);
        }
        if (this.beforeUnloadHandler) {
            window.removeEventListener('beforeunload', this.beforeUnloadHandler);
        }
    }

    onDriveSDKMetricEvent(event: MetricEvent) {
        if (this.isCoreFeatureError(event)) {
            this.markCoreFeatureError();
        }
    }

    private isCoreFeatureError(event: MetricEvent) {
        return (
            (event.eventName === 'upload' && event.error && event.error !== 'network_error') ||
            (event.eventName === 'download' && event.error && event.error !== 'network_error') ||
            (event.eventName === 'decryptionError' && !event.fromBefore2024)
        );
    }

    markCoreFeatureError() {
        this.mark('coreFeatureError');
    }

    markCrashError(error: Error) {
        this.mark('crashError');

        traceError(error, {
            tags: {
                driveMetricEvent: 'crashError',
            },
        });
    }

    markOtherError() {
        this.mark('otherError');
    }

    private mark(type: ErrorType) {
        logger.debug(`Marking ${type} error`);

        // Send immediate error metric for every error occurrence.
        metrics.drive_error_total.increment({ category: type });

        // Record for periodic aggregated report
        this.errorMarks.set(type, Date.now());
    }

    private async sendPeriodicReport() {
        logger.debug('Sending periodic report');

        const now = Date.now();

        const hasError = (type: ErrorType): 'true' | 'false' => {
            const lastMark = this.errorMarks.get(type);
            return lastMark !== undefined && now - lastMark <= FIVE_MINUTES_IN_MILLISECONDS ? 'true' : 'false';
        };

        metrics.drive_error_erroring_users_total.increment({
            plan: this.userPlanProvider.getUserPlan(),
            coreFeatureError: hasError('coreFeatureError'),
            crashError: hasError('crashError'),
            otherError: hasError('otherError'),
        });
    }

    // Used solely for testing purposes
    public _getErrorMarks = () => this.errorMarks;
}
