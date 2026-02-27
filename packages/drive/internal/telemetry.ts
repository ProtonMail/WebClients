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
import type { MetricPerformanceEvent } from '@protontech/drive-sdk/dist/interface/telemetry';
import type { LogHandler, MetricRecord, MetricHandler as SDKMetricHandler } from '@protontech/drive-sdk/dist/telemetry';
import { LogFilter, LogLevel, Telemetry } from '@protontech/drive-sdk/dist/telemetry';

import metrics from '@proton/metrics';
import { getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';

export type UserPlan = 'free' | 'paid' | 'anonymous' | 'unknown';

const REPORT_ERRORING_USERS_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function initTelemetry(
    userPlan: UserPlan = 'unknown',
    logHandler: LogHandler,
    metricHandler?: SDKMetricHandler<MetricEvent>,
    debug = false
) {
    const metricHandlers: SDKMetricHandler<MetricEvent>[] = [new MetricHandler(userPlan)];
    if (metricHandler) {
        metricHandlers.push(metricHandler);
    }

    const telemetry = new Telemetry({
        logFilter: new LogFilter({
            globalLevel: debug ? LogLevel.DEBUG : LogLevel.INFO,
            loggerLevels: {
                api: debug ? LogLevel.DEBUG : LogLevel.WARNING,
            },
        }),
        logHandlers: [logHandler],
        metricHandlers,
    });

    return telemetry;
}

export class MetricHandler {
    private lastUploadError: Date | undefined;

    private lastDownloadError: Date | undefined;

    private lastIntegrityError: Date | undefined;

    private performanceMetricsInterval: ReturnType<typeof setInterval> | undefined;
    private performanceMetrics: Map<
        string,
        {
            type: 'content_encryption' | 'content_decryption';
            cryptoModel: 'v1' | 'v1.5';
            bytesProcessed: number;
            milliseconds: number;
        }
    > = new Map();

    constructor(private userPlan: UserPlan) {
        this.userPlan = userPlan;
    }

    onEvent(metric: MetricRecord<MetricEvent>): void {
        if (metric.event.eventName === 'apiRetrySucceeded') {
            this.onApiRetrySucceeded(metric.event);
        } else if (metric.event.eventName === 'debounceLongWait') {
            this.onDebounceLongWait();
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
        } else if (metric.event.eventName === 'performance') {
            this.onPerformance(metric.event);
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

    private onDebounceLongWait() {
        metrics.drive_sdk_debounce_total.increment({});
    }

    private onUpload(metric: MetricUploadEvent) {
        if (metric.originalError) {
            // NotReadableError throws some browsers when trying to read a file
            // which is not available anymore. This is purely user side issue
            // and thus ignored from metrics.
            if (
                metric.originalError instanceof Error &&
                (metric.originalError.name === 'NotReadableError' || metric.originalError.name === 'NotFoundError')
            ) {
                return;
            }
            // useApi wraps auth errors which SDK doesn't know about.
            if (getIs401Error(metric.originalError)) {
                metric.error = '4xx';
            }
        }

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
                Value: reduceSizePrecision(metric.expectedSize),
                Labels: {},
            });

            // Report only once per interval.
            if (
                metric.error !== 'network_error' &&
                (!this.lastUploadError || this.lastUploadError.getTime() < Date.now() - REPORT_ERRORING_USERS_INTERVAL)
            ) {
                metrics.drive_sdk_upload_erroring_users_total.increment({
                    volumeType: metric.volumeType || 'unknown',
                    userPlan: this.userPlan,
                });
                this.lastUploadError = new Date();
            }

            if (metric.error === 'unknown' || metric.error === 'integrity_error') {
                captureMessage('Metric event details: upload unknown error', {
                    level: 'debug', // Debug as we need it only when we investigate metric reports.
                    tags: {
                        driveSdkMetricEvent: 'uploadError',
                    },
                    extra: {
                        error: metric.originalError,
                        errorType: metric.error,
                    },
                });
            }
        }
    }

    private onDownload(metric: MetricDownloadEvent) {
        if (metric.originalError) {
            // useApi wraps auth errors which SDK doesn't know about.
            if (getIs401Error(metric.originalError)) {
                metric.error = '4xx';
            }
        }

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
                Value: reduceSizePrecision(metric.claimedFileSize || 0), // Zero is considered as unknown.
                Labels: {},
            });

            // Report only once per interval.
            if (
                metric.error !== 'network_error' &&
                (!this.lastDownloadError ||
                    this.lastDownloadError.getTime() < Date.now() - REPORT_ERRORING_USERS_INTERVAL)
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
        metrics.drive_sdk_integrity_decryption_errors_total.increment({
            volumeType: metric.volumeType || 'unknown',
            field: metric.field,
            fromBefore2024: this.getYesNoUnknown(metric.fromBefore2024),
        });

        if (metric.fromBefore2024 === false) {
            this.reportIntegrityErroringUsers(metric);

            captureMessage('Metric event details: decryption error', {
                level: 'error',
                tags: {
                    driveSdkMetricEvent: 'decryptionError',
                },
                extra: {
                    volumeType: metric.volumeType || 'unknown',
                    uid: metric.uid,
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

    private onPerformance(metric: MetricPerformanceEvent) {
        if (!this.performanceMetricsInterval) {
            this.performanceMetricsInterval = setInterval(() => {
                this.sendPerformanceMetrics();
            }, 30 * 1000);
        }

        const key = `${metric.type}-${metric.cryptoModel}`;
        const performanceMetric = this.performanceMetrics.get(key);
        if (performanceMetric) {
            performanceMetric.bytesProcessed += metric.bytesProcessed;
            performanceMetric.milliseconds += metric.milliseconds;
        } else {
            this.performanceMetrics.set(key, {
                type: metric.type,
                cryptoModel: metric.cryptoModel,
                bytesProcessed: metric.bytesProcessed,
                milliseconds: metric.milliseconds,
            });
        }
    }

    private sendPerformanceMetrics() {
        for (const { type, cryptoModel, bytesProcessed, milliseconds } of this.performanceMetrics.values()) {
            if (bytesProcessed > 0 && milliseconds > 0) {
                const megabytesProcessed = bytesProcessed / 1024 / 1024;
                const seconds = milliseconds / 1000;
                const mbps = megabytesProcessed / seconds;
                metrics.drive_crypto_speed_histogram.observe({
                    Value: mbps,
                    Labels: {
                        type,
                        cryptoModel,
                    },
                });
            }
        }
        this.performanceMetrics.clear();
    }

    private getYesNoUnknown(value: boolean | undefined): 'yes' | 'no' | 'unknown' {
        if (value === undefined) {
            return 'unknown';
        }
        return value ? 'yes' : 'no';
    }
}

export function reduceSizePrecision(size: number): number {
    // The client shouldn't send the clear text size of the file.
    // The intented upload size is needed only for early validation that
    // the file can fit in the remaining quota to avoid data transfer when
    // the upload would be rejected. The backend will still validate
    // the quota during block upload and revision commit.
    const precision = 100_000; // bytes

    if (size === 0) {
        return 0;
    }
    // We care about very small files in metrics, thus we handle explicitely
    // the very small files so they appear correctly in metrics.
    if (size < 4096) {
        return 4095;
    }
    if (size < precision) {
        return precision;
    }
    return Math.floor(size / precision) * precision;
}
