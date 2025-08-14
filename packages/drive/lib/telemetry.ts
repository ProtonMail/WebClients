import type {
    MetricAPIRetrySucceededEvent,
    MetricBlockVerificationErrorEvent,
    MetricDecryptionErrorEvent,
    MetricDownloadEvent,
    MetricEvent,
    MetricUploadEvent,
    MetricVerificationErrorEvent,
    MetricVolumeEventsSubscriptionsChangedEvent,
} from '@protontech/drive-sdk';
import type { MetricRecord } from '@protontech/drive-sdk/dist/telemetry';
import {
    ConsoleLogHandler,
    LogFilter,
    LogLevel,
    MemoryLogHandler,
    Telemetry,
} from '@protontech/drive-sdk/dist/telemetry';

import metrics from '@proton/metrics';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';

import { SentryLogHandler } from './logHandlers/sentryLogHandler';

export type UserPlan = 'free' | 'paid' | 'anonymous' | 'unknown';

const REPORT_ERRORING_USERS_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function initTelemetry(userPlan: UserPlan = 'unknown', debug = false) {
    const memoryLogHandler = new MemoryLogHandler();
    const sentryLogHandler = new SentryLogHandler();

    const telemetry = new Telemetry({
        logFilter: new LogFilter({
            globalLevel: debug ? LogLevel.DEBUG : LogLevel.INFO,
            loggerLevels: {
                api: debug ? LogLevel.DEBUG : LogLevel.WARNING,
            },
        }),
        logHandlers: [new ConsoleLogHandler(), memoryLogHandler, sentryLogHandler],
        metricHandlers: [new MetricHandler(userPlan)],
    });

    return {
        telemetry,
        memoryLogHandler,
    };
}

export class MetricHandler {
    private lastUploadError: Date | undefined;

    private lastDownloadError: Date | undefined;

    private lastIntegrityError: Date | undefined;

    constructor(private userPlan: UserPlan) {
        this.userPlan = userPlan;
    }

    onEvent(metric: MetricRecord<MetricEvent>): void {
        if (metric.event.eventName === 'apiRetrySucceeded') {
            this.onApiRetrySucceeded(metric.event);
        } else if (metric.event.eventName === 'upload') {
            this.onUpload(metric.event);
        } else if (metric.event.eventName === 'download') {
            this.onDownload(metric.event);
        } else if (metric.event.eventName === 'decryptionError') {
            this.onDecryptionError(metric.event);
        } else if (metric.event.eventName === 'verificationError') {
            this.onVerificationError(metric.event);
        } else if (metric.event.eventName === 'blockVerificationError') {
            this.onBlockVerificationError(metric.event);
        } else if (metric.event.eventName === 'volumeEventsSubscriptionsChanged') {
            this.onVolumeEventsSubscriptionsChanged(metric.event);
        } else {
            captureMessage(`Metric event details: unknown metric event`, {
                level: 'error',
                tags: {
                    driveSdkMetricEvent: 'unknownEvent',
                },
                extra: {
                    event: metric.event,
                },
            });
        }
    }

    private onApiRetrySucceeded(metric: MetricAPIRetrySucceededEvent) {
        metrics.drive_sdk_api_retry_succeeded_total.increment({
            volumeType: 'unknown',
        });

        captureMessage('Metric event details: apiRetrySucceeded', {
            level: 'debug', // Debug as we need it only when we investigate metric reports.
            tags: {
                driveSdkMetricEvent: 'apiRetrySucceeded',
            },
            extra: {
                url: metric.url,
                failedAttempts: metric.failedAttempts,
            },
        });
    }

    private onUpload(metric: MetricUploadEvent) {
        metrics.drive_sdk_upload_success_rate_total.increment({
            volumeType: metric.volumeType || 'unknown',
            status: !metric.error ? 'success' : 'failure',
        });

        if (metric.error) {
            metrics.drive_sdk_upload_errors_total.increment({
                volumeType: metric.volumeType || 'unknown',
                type: metric.error,
            });

            metrics.drive_sdk_upload_errors_transfer_size_histogram.observe({
                Value: metric.uploadedSize,
                Labels: {},
            });
            metrics.drive_sdk_upload_errors_file_size_histogram.observe({
                Value: metric.expectedSize,
                Labels: {},
            });

            // Report only once per interval.
            if (!this.lastUploadError || this.lastUploadError.getTime() < Date.now() - REPORT_ERRORING_USERS_INTERVAL) {
                metrics.drive_sdk_upload_erroring_users_total.increment({
                    volumeType: metric.volumeType || 'unknown',
                    userPlan: this.userPlan,
                });
                this.lastUploadError = new Date();
            }

            if (metric.error === 'unknown') {
                captureMessage('Metric event details: upload unknown error', {
                    level: 'debug', // Debug as we need it only when we investigate metric reports.
                    tags: {
                        driveSdkMetricEvent: 'uploadError',
                    },
                    extra: {
                        error: metric.originalError,
                    },
                });
            }
        }
    }

    private onDownload(metric: MetricDownloadEvent) {
        metrics.drive_sdk_download_success_rate_total.increment({
            volumeType: metric.volumeType || 'unknown',
            status: !metric.error ? 'success' : 'failure',
        });

        if (metric.error) {
            metrics.drive_sdk_download_errors_total.increment({
                volumeType: metric.volumeType || 'unknown',
                type: metric.error,
            });

            metrics.drive_sdk_download_errors_transfer_size_histogram.observe({
                Value: metric.downloadedSize,
                Labels: {},
            });
            metrics.drive_sdk_download_errors_file_size_histogram.observe({
                Value: metric.claimedFileSize || 0, // Zero is considered as unknown.
                Labels: {},
            });

            // Report only once per interval.
            if (
                !this.lastDownloadError ||
                this.lastDownloadError.getTime() < Date.now() - REPORT_ERRORING_USERS_INTERVAL
            ) {
                metrics.drive_sdk_download_erroring_users_total.increment({
                    volumeType: metric.volumeType || 'unknown',
                    userPlan: this.userPlan,
                });
                this.lastDownloadError = new Date();
            }

            if (metric.error === 'unknown') {
                captureMessage('Metric event details: download unknown error', {
                    level: 'debug', // Debug as we need it only when we investigate metric reports.
                    tags: {
                        driveSdkMetricEvent: 'downloadError',
                    },
                    extra: {
                        error: metric.originalError,
                    },
                });
            }
        }
    }

    private onDecryptionError(metric: MetricDecryptionErrorEvent) {
        // TODO: shareUrlPassword is not supported by metrics yet.
        const field = metric.field === 'shareUrlPassword' ? 'shareKey' : metric.field;

        metrics.drive_sdk_integrity_decryption_errors_total.increment({
            volumeType: metric.volumeType || 'unknown',
            field,
            fromBefore2024: this.getYesNoUnknown(metric.fromBefore2024),
        });

        if (metric.fromBefore2024 === false) {
            this.reportIntegrityErroringUsers(metric);

            captureMessage('Metric event details: decryption error', {
                level: 'debug', // Debug as we need it only when we investigate metric reports.
                tags: {
                    driveSdkMetricEvent: 'decryptionError',
                },
                extra: {
                    volumeType: metric.volumeType || 'unknown',
                    field: metric.field,
                    fromBefore2024: metric.fromBefore2024,
                    error: metric.error,
                },
            });
        }
    }

    private onVerificationError(metric: MetricVerificationErrorEvent) {
        metrics.drive_sdk_integrity_verification_errors_total.increment({
            volumeType: metric.volumeType || 'unknown',
            field: metric.field,
            addressMatchingDefaultShare: this.getYesNoUnknown(metric.addressMatchingDefaultShare),
            fromBefore2024: this.getYesNoUnknown(metric.fromBefore2024),
        });

        if (metric.fromBefore2024 === false && metric.addressMatchingDefaultShare === true) {
            this.reportIntegrityErroringUsers(metric);
        }
    }

    private reportIntegrityErroringUsers(metric: MetricDecryptionErrorEvent | MetricVerificationErrorEvent) {
        if (
            !this.lastIntegrityError ||
            this.lastIntegrityError.getTime() < Date.now() - REPORT_ERRORING_USERS_INTERVAL
        ) {
            metrics.drive_sdk_integrity_erroring_users_total.increment({
                volumeType: metric.volumeType || 'unknown',
                userPlan: this.userPlan,
            });
            this.lastIntegrityError = new Date();
        }
    }

    private onBlockVerificationError(metric: MetricBlockVerificationErrorEvent) {
        metrics.drive_sdk_integrity_block_verification_errors_total.increment({
            retryHelped: metric.retryHelped ? 'yes' : 'no',
        });
    }

    private onVolumeEventsSubscriptionsChanged(metric: MetricVolumeEventsSubscriptionsChangedEvent) {
        metrics.drive_sdk_volume_events_subscriptions_histogram.observe({
            Value: metric.numberOfVolumeSubscriptions,
            Labels: {
                userPlan: this.userPlan,
            },
        });
    }

    private getYesNoUnknown(value: boolean | undefined): 'yes' | 'no' | 'unknown' {
        if (value === undefined) {
            return 'unknown';
        }
        return value ? 'yes' : 'no';
    }
}
