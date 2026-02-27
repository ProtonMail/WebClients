import { MetricVolumeType } from '@protontech/drive-sdk';

import metrics from '@proton/metrics';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';

import { MetricHandler, reduceSizePrecision } from './telemetry';

jest.mock('@proton/metrics', () => ({
    drive_sdk_api_retry_succeeded_total: {
        increment: jest.fn(),
    },
    drive_sdk_upload_success_rate_total: {
        increment: jest.fn(),
    },
    drive_sdk_upload_errors_total: {
        increment: jest.fn(),
    },
    drive_sdk_upload_errors_transfer_size_histogram: {
        observe: jest.fn(),
    },
    drive_sdk_upload_errors_file_size_histogram: {
        observe: jest.fn(),
    },
    drive_sdk_upload_erroring_users_total: {
        increment: jest.fn(),
    },
    drive_sdk_download_success_rate_total: {
        increment: jest.fn(),
    },
    drive_sdk_download_errors_total: {
        increment: jest.fn(),
    },
    drive_sdk_download_errors_transfer_size_histogram: {
        observe: jest.fn(),
    },
    drive_sdk_download_errors_file_size_histogram: {
        observe: jest.fn(),
    },
    drive_sdk_download_erroring_users_total: {
        increment: jest.fn(),
    },
    drive_sdk_integrity_decryption_errors_total: {
        increment: jest.fn(),
    },
    drive_sdk_integrity_verification_errors_total: {
        increment: jest.fn(),
    },
    drive_sdk_integrity_erroring_users_total: {
        increment: jest.fn(),
    },
    drive_sdk_integrity_block_verification_errors_total: {
        increment: jest.fn(),
    },
    drive_sdk_volume_events_subscriptions_histogram: {
        observe: jest.fn(),
    },
    drive_crypto_speed_histogram: {
        observe: jest.fn(),
    },
}));

jest.mock('@proton/shared/lib/helpers/sentry', () => ({
    captureMessage: jest.fn(),
}));

describe('MetricHandler', () => {
    let metricHandler: MetricHandler;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-01T00:00:00Z'));

        metricHandler = new MetricHandler('free');
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('apiRetrySucceeded', () => {
        it('should report metrics and sentry message', () => {
            metricHandler.onEvent({
                time: new Date(),
                event: {
                    eventName: 'apiRetrySucceeded',
                    url: 'https://api.proton.me/drive/v1/files',
                    failedAttempts: 3,
                },
            });

            expect(metrics.drive_sdk_api_retry_succeeded_total.increment).toHaveBeenCalledWith({
                volumeType: 'unknown',
            });

            expect(captureMessage).toHaveBeenCalledWith('Metric event details: apiRetrySucceeded', {
                level: 'debug',
                tags: {
                    driveSdkMetricEvent: 'apiRetrySucceeded',
                },
                extra: {
                    url: 'https://api.proton.me/drive/v1/files',
                    failedAttempts: 3,
                },
            });
        });
    });

    describe('upload', () => {
        describe('successful upload', () => {
            it('should report success metrics without error tracking', () => {
                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'upload',
                        volumeType: MetricVolumeType.OwnVolume,
                        uploadedSize: 1024,
                        expectedSize: 1024,
                    },
                });

                expect(metrics.drive_sdk_upload_success_rate_total.increment).toHaveBeenCalledWith({
                    volumeType: 'own_volume',
                    status: 'success',
                });

                expect(metrics.drive_sdk_upload_errors_total.increment).not.toHaveBeenCalled();
                expect(metrics.drive_sdk_upload_errors_transfer_size_histogram.observe).not.toHaveBeenCalled();
                expect(metrics.drive_sdk_upload_errors_file_size_histogram.observe).not.toHaveBeenCalled();
                expect(metrics.drive_sdk_upload_erroring_users_total.increment).not.toHaveBeenCalled();
                expect(captureMessage).not.toHaveBeenCalled();
            });

            it('should handle missing context', () => {
                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'upload',
                        uploadedSize: 1024,
                        expectedSize: 1024,
                    },
                });

                expect(metrics.drive_sdk_upload_success_rate_total.increment).toHaveBeenCalledWith({
                    volumeType: 'unknown',
                    status: 'success',
                });

                expect(metrics.drive_sdk_upload_errors_total.increment).not.toHaveBeenCalled();
                expect(metrics.drive_sdk_upload_errors_transfer_size_histogram.observe).not.toHaveBeenCalled();
                expect(metrics.drive_sdk_upload_errors_file_size_histogram.observe).not.toHaveBeenCalled();
                expect(metrics.drive_sdk_upload_erroring_users_total.increment).not.toHaveBeenCalled();
                expect(captureMessage).not.toHaveBeenCalled();
            });
        });

        describe('unsuccessful upload', () => {
            it('should report failure metrics for known error', () => {
                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'upload',
                        volumeType: MetricVolumeType.OwnVolume,
                        uploadedSize: 512,
                        expectedSize: 1024,
                        error: '4xx',
                    },
                });

                expect(metrics.drive_sdk_upload_success_rate_total.increment).toHaveBeenCalledWith({
                    volumeType: 'own_volume',
                    status: 'failure',
                });
                expect(metrics.drive_sdk_upload_errors_total.increment).toHaveBeenCalledWith({
                    volumeType: 'own_volume',
                    type: '4xx',
                });
                expect(metrics.drive_sdk_upload_errors_transfer_size_histogram.observe).toHaveBeenCalledWith({
                    Value: 512,
                    Labels: {},
                });
                expect(metrics.drive_sdk_upload_errors_file_size_histogram.observe).toHaveBeenCalledWith({
                    Value: 4095,
                    Labels: {},
                });
                expect(metrics.drive_sdk_upload_erroring_users_total.increment).toHaveBeenCalledWith({
                    volumeType: 'own_volume',
                    userPlan: 'free',
                });
                expect(captureMessage).not.toHaveBeenCalled();
            });

            it('should report failure metrics for unknown error and capture sentry message', () => {
                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'upload',
                        volumeType: MetricVolumeType.OwnVolume,
                        uploadedSize: 512,
                        expectedSize: 1024,
                        error: 'unknown',
                        originalError: new Error('some error'),
                    },
                });

                expect(metrics.drive_sdk_upload_errors_total.increment).toHaveBeenCalledWith({
                    volumeType: 'own_volume',
                    type: 'unknown',
                });
                expect(captureMessage).toHaveBeenCalledWith('Metric event details: upload unknown error', {
                    level: 'debug',
                    tags: {
                        driveSdkMetricEvent: 'uploadError',
                    },
                    extra: {
                        error: new Error('some error'),
                        errorType: 'unknown',
                    },
                });
            });
        });

        describe('erroring users reporting', () => {
            it('should report erroring users once for single event', () => {
                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'upload',
                        volumeType: MetricVolumeType.OwnVolume,
                        uploadedSize: 512,
                        expectedSize: 1024,
                        error: 'unknown',
                    },
                });

                expect(metrics.drive_sdk_upload_erroring_users_total.increment).toHaveBeenCalledTimes(1);
                expect(metrics.drive_sdk_upload_erroring_users_total.increment).toHaveBeenCalledWith({
                    volumeType: 'own_volume',
                    userPlan: 'free',
                });
            });

            it('should not report erroring users twice for events right after each other', () => {
                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'upload',
                        volumeType: MetricVolumeType.OwnVolume,
                        uploadedSize: 512,
                        expectedSize: 1024,
                        error: 'unknown',
                    },
                });

                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'upload',
                        volumeType: MetricVolumeType.OwnVolume,
                        uploadedSize: 256,
                        expectedSize: 1024,
                        error: 'server_error',
                    },
                });

                expect(metrics.drive_sdk_upload_erroring_users_total.increment).toHaveBeenCalledTimes(1);
            });

            it('should report erroring users twice for events five minutes apart', () => {
                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'upload',
                        volumeType: MetricVolumeType.OwnVolume,
                        uploadedSize: 512,
                        expectedSize: 1024,
                        error: 'unknown',
                    },
                });

                expect(metrics.drive_sdk_upload_erroring_users_total.increment).toHaveBeenCalledTimes(1);

                // Advance time by 5 minutes
                jest.advanceTimersByTime(5 * 60 * 1000 + 1);

                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'upload',
                        volumeType: MetricVolumeType.OwnVolume,
                        uploadedSize: 256,
                        expectedSize: 1024,
                        error: 'server_error',
                    },
                });

                expect(metrics.drive_sdk_upload_erroring_users_total.increment).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('download', () => {
        describe('successful download', () => {
            it('should report success metrics without error tracking', () => {
                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'download',
                        volumeType: MetricVolumeType.OwnVolume,
                        downloadedSize: 1024,
                        claimedFileSize: 1024,
                    },
                });

                expect(metrics.drive_sdk_download_success_rate_total.increment).toHaveBeenCalledWith({
                    volumeType: 'own_volume',
                    status: 'success',
                });

                expect(metrics.drive_sdk_download_errors_total.increment).not.toHaveBeenCalled();
                expect(metrics.drive_sdk_download_errors_transfer_size_histogram.observe).not.toHaveBeenCalled();
                expect(metrics.drive_sdk_download_errors_file_size_histogram.observe).not.toHaveBeenCalled();
                expect(metrics.drive_sdk_download_erroring_users_total.increment).not.toHaveBeenCalled();
                expect(captureMessage).not.toHaveBeenCalled();
            });

            it('should handle missing context', () => {
                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'download',
                        downloadedSize: 1024,
                        claimedFileSize: 1024,
                    },
                });

                expect(metrics.drive_sdk_download_success_rate_total.increment).toHaveBeenCalledWith({
                    volumeType: 'unknown',
                    status: 'success',
                });

                expect(metrics.drive_sdk_download_errors_total.increment).not.toHaveBeenCalled();
                expect(metrics.drive_sdk_download_errors_transfer_size_histogram.observe).not.toHaveBeenCalled();
                expect(metrics.drive_sdk_download_errors_file_size_histogram.observe).not.toHaveBeenCalled();
                expect(metrics.drive_sdk_download_erroring_users_total.increment).not.toHaveBeenCalled();
                expect(captureMessage).not.toHaveBeenCalled();
            });
        });

        describe('unsuccessful download', () => {
            it('should report failure metrics for known error', () => {
                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'download',
                        volumeType: MetricVolumeType.OwnVolume,
                        downloadedSize: 512,
                        claimedFileSize: 1024,
                        error: '4xx',
                    },
                });

                expect(metrics.drive_sdk_download_success_rate_total.increment).toHaveBeenCalledWith({
                    volumeType: 'own_volume',
                    status: 'failure',
                });
                expect(metrics.drive_sdk_download_errors_total.increment).toHaveBeenCalledWith({
                    volumeType: 'own_volume',
                    type: '4xx',
                });
                expect(metrics.drive_sdk_download_errors_transfer_size_histogram.observe).toHaveBeenCalledWith({
                    Value: 512,
                    Labels: {},
                });
                expect(metrics.drive_sdk_download_errors_file_size_histogram.observe).toHaveBeenCalledWith({
                    Value: 4095,
                    Labels: {},
                });
                expect(metrics.drive_sdk_download_erroring_users_total.increment).toHaveBeenCalledWith({
                    volumeType: 'own_volume',
                    userPlan: 'free',
                });
                expect(captureMessage).not.toHaveBeenCalled();
            });

            it('should report failure metrics for unknown error and capture sentry message', () => {
                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'download',
                        volumeType: MetricVolumeType.OwnVolume,
                        downloadedSize: 512,
                        claimedFileSize: 1024,
                        error: 'unknown',
                        originalError: new Error('some error'),
                    },
                });

                expect(metrics.drive_sdk_download_errors_total.increment).toHaveBeenCalledWith({
                    volumeType: 'own_volume',
                    type: 'unknown',
                });
                expect(captureMessage).toHaveBeenCalledWith('Metric event details: download unknown error', {
                    level: 'debug',
                    tags: {
                        driveSdkMetricEvent: 'downloadError',
                    },
                    extra: {
                        error: new Error('some error'),
                    },
                });
            });

            it('should handle missing claimedFileSize', () => {
                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'download',
                        volumeType: MetricVolumeType.OwnVolume,
                        downloadedSize: 512,
                        error: 'network_error',
                    },
                });

                expect(metrics.drive_sdk_download_errors_file_size_histogram.observe).toHaveBeenCalledWith({
                    Value: 0,
                    Labels: {},
                });
            });
        });

        describe('erroring users reporting', () => {
            it('should report erroring users once for single event', () => {
                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'download',
                        volumeType: MetricVolumeType.OwnVolume,
                        downloadedSize: 512,
                        claimedFileSize: 1024,
                        error: 'unknown',
                    },
                });

                expect(metrics.drive_sdk_download_erroring_users_total.increment).toHaveBeenCalledTimes(1);
                expect(metrics.drive_sdk_download_erroring_users_total.increment).toHaveBeenCalledWith({
                    volumeType: 'own_volume',
                    userPlan: 'free',
                });
            });

            it('should not report erroring users twice for events right after each other', () => {
                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'download',
                        volumeType: MetricVolumeType.OwnVolume,
                        downloadedSize: 512,
                        claimedFileSize: 1024,
                        error: 'unknown',
                    },
                });

                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'download',
                        volumeType: MetricVolumeType.OwnVolume,
                        downloadedSize: 256,
                        claimedFileSize: 1024,
                        error: 'decryption_error',
                    },
                });

                expect(metrics.drive_sdk_download_erroring_users_total.increment).toHaveBeenCalledTimes(1);
            });

            it('should report erroring users twice for events five minutes apart', () => {
                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'download',
                        volumeType: MetricVolumeType.OwnVolume,
                        downloadedSize: 512,
                        claimedFileSize: 1024,
                        error: 'unknown',
                    },
                });

                expect(metrics.drive_sdk_download_erroring_users_total.increment).toHaveBeenCalledTimes(1);

                // Advance time by 5 minutes
                jest.advanceTimersByTime(5 * 60 * 1000 + 1);

                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'download',
                        volumeType: MetricVolumeType.OwnVolume,
                        downloadedSize: 256,
                        claimedFileSize: 1024,
                        error: 'decryption_error',
                    },
                });

                expect(metrics.drive_sdk_download_erroring_users_total.increment).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('decryptionError', () => {
        it('should report decryption error metrics', () => {
            metricHandler.onEvent({
                time: new Date(),
                event: {
                    eventName: 'decryptionError',
                    volumeType: MetricVolumeType.OwnVolume,
                    field: 'nodeKey',
                    fromBefore2024: true,
                    error: 'Invalid key',
                    uid: 'uid',
                },
            });

            expect(metrics.drive_sdk_integrity_decryption_errors_total.increment).toHaveBeenCalledWith({
                volumeType: 'own_volume',
                field: 'nodeKey',
                fromBefore2024: 'yes',
            });
        });

        it('should handle undefined fromBefore2024', () => {
            metricHandler.onEvent({
                time: new Date(),
                event: {
                    eventName: 'decryptionError',
                    volumeType: MetricVolumeType.OwnVolume,
                    field: 'nodeKey',
                    fromBefore2024: undefined,
                    error: 'Invalid key',
                    uid: 'uid',
                },
            });

            expect(metrics.drive_sdk_integrity_decryption_errors_total.increment).toHaveBeenCalledWith({
                volumeType: 'own_volume',
                field: 'nodeKey',
                fromBefore2024: 'unknown',
            });
        });

        it('should capture sentry message when not from before 2024', () => {
            metricHandler.onEvent({
                time: new Date(),
                event: {
                    eventName: 'decryptionError',
                    volumeType: MetricVolumeType.OwnVolume,
                    field: 'nodeKey',
                    fromBefore2024: false,
                    error: 'Invalid key',
                    uid: 'uid',
                },
            });

            expect(captureMessage).toHaveBeenCalledWith('Metric event details: decryption error', {
                level: 'error',
                tags: {
                    driveSdkMetricEvent: 'decryptionError',
                },
                extra: {
                    volumeType: MetricVolumeType.OwnVolume,
                    field: 'nodeKey',
                    fromBefore2024: false,
                    error: 'Invalid key',
                    uid: 'uid',
                },
            });
        });

        it('should not capture sentry message when fromBefore2024 is true', () => {
            metricHandler.onEvent({
                time: new Date(),
                event: {
                    eventName: 'decryptionError',
                    volumeType: MetricVolumeType.OwnVolume,
                    field: 'nodeKey',
                    fromBefore2024: true,
                    error: 'Invalid key',
                    uid: 'uid',
                },
            });

            expect(captureMessage).not.toHaveBeenCalled();
        });

        describe('erroring users reporting', () => {
            it('should report erroring users once for single event', () => {
                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'decryptionError',
                        volumeType: MetricVolumeType.OwnVolume,
                        field: 'nodeKey',
                        fromBefore2024: false,
                        error: 'Invalid key',
                        uid: 'uid',
                    },
                });

                expect(metrics.drive_sdk_integrity_erroring_users_total.increment).toHaveBeenCalledTimes(1);
                expect(metrics.drive_sdk_integrity_erroring_users_total.increment).toHaveBeenCalledWith({
                    volumeType: 'own_volume',
                    userPlan: 'free',
                });
            });

            it('should not report erroring users twice for events right after each other', () => {
                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'decryptionError',
                        volumeType: MetricVolumeType.OwnVolume,
                        field: 'nodeKey',
                        fromBefore2024: false,
                        error: 'Invalid key',
                        uid: 'uid',
                    },
                });

                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'verificationError',
                        volumeType: MetricVolumeType.OwnVolume,
                        field: 'nodeName',
                        fromBefore2024: false,
                        addressMatchingDefaultShare: true,
                        uid: 'uid',
                    },
                });

                expect(metrics.drive_sdk_integrity_erroring_users_total.increment).toHaveBeenCalledTimes(1);
            });

            it('should report erroring users twice for events five minutes apart', () => {
                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'decryptionError',
                        volumeType: MetricVolumeType.OwnVolume,
                        field: 'nodeKey',
                        fromBefore2024: false,
                        error: 'Invalid key',
                        uid: 'uid',
                    },
                });

                expect(metrics.drive_sdk_integrity_erroring_users_total.increment).toHaveBeenCalledTimes(1);

                // Advance time by 5 minutes
                jest.advanceTimersByTime(5 * 60 * 1000 + 1);

                metricHandler.onEvent({
                    time: new Date(),
                    event: {
                        eventName: 'verificationError',
                        volumeType: MetricVolumeType.OwnVolume,
                        field: 'nodeName',
                        fromBefore2024: false,
                        addressMatchingDefaultShare: true,
                        uid: 'uid',
                    },
                });

                expect(metrics.drive_sdk_integrity_erroring_users_total.increment).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('verificationError', () => {
        it('should report verification error metrics', () => {
            metricHandler.onEvent({
                time: new Date(),
                event: {
                    eventName: 'verificationError',
                    volumeType: MetricVolumeType.OwnVolume,
                    field: 'nodeName',
                    fromBefore2024: false,
                    addressMatchingDefaultShare: true,
                    uid: 'uid',
                },
            });

            expect(metrics.drive_sdk_integrity_verification_errors_total.increment).toHaveBeenCalledWith({
                volumeType: MetricVolumeType.OwnVolume,
                field: 'nodeName',
                addressMatchingDefaultShare: 'yes',
                fromBefore2024: 'no',
            });
        });

        it('should handle undefined boolean values', () => {
            metricHandler.onEvent({
                time: new Date(),
                event: {
                    eventName: 'verificationError',
                    volumeType: MetricVolumeType.OwnVolume,
                    field: 'nodeName',
                    fromBefore2024: undefined,
                    addressMatchingDefaultShare: undefined,
                    uid: 'uid',
                },
            });

            expect(metrics.drive_sdk_integrity_verification_errors_total.increment).toHaveBeenCalledWith({
                volumeType: MetricVolumeType.OwnVolume,
                field: 'nodeName',
                addressMatchingDefaultShare: 'unknown',
                fromBefore2024: 'unknown',
            });
        });
    });

    describe('blockVerificationError', () => {
        it('should report block verification error metrics', () => {
            metricHandler.onEvent({
                time: new Date(),
                event: {
                    eventName: 'blockVerificationError',
                    retryHelped: true,
                },
            });

            expect(metrics.drive_sdk_integrity_block_verification_errors_total.increment).toHaveBeenCalledWith({
                retryHelped: 'yes',
            });
        });

        it('should handle retryHelped false', () => {
            metricHandler.onEvent({
                time: new Date(),
                event: {
                    eventName: 'blockVerificationError',
                    retryHelped: false,
                },
            });

            expect(metrics.drive_sdk_integrity_block_verification_errors_total.increment).toHaveBeenCalledWith({
                retryHelped: 'no',
            });
        });
    });

    describe('volumeEventsSubscriptionsChanged', () => {
        it('should report volume events subscriptions histogram', () => {
            metricHandler.onEvent({
                time: new Date(),
                event: {
                    eventName: 'volumeEventsSubscriptionsChanged',
                    numberOfVolumeSubscriptions: 5,
                },
            });

            expect(metrics.drive_sdk_volume_events_subscriptions_histogram.observe).toHaveBeenCalledWith({
                Value: 5,
                Labels: {
                    userPlan: 'free',
                },
            });
        });
    });

    describe('performance', () => {
        it('should start interval and report crypto speed after 30 seconds', () => {
            metricHandler.onEvent({
                time: new Date(),
                event: {
                    eventName: 'performance',
                    type: 'content_encryption',
                    cryptoModel: 'v1',
                    bytesProcessed: 1024 * 1024, // 1 MB
                    milliseconds: 1000, // 1 second
                },
            });

            expect(metrics.drive_crypto_speed_histogram.observe).not.toHaveBeenCalled();

            jest.advanceTimersByTime(30 * 1000);

            expect(metrics.drive_crypto_speed_histogram.observe).toHaveBeenCalledTimes(1);
            expect(metrics.drive_crypto_speed_histogram.observe).toHaveBeenCalledWith({
                Value: 1, // 1 MB / 1 s = 1 MB/s
                Labels: {
                    type: 'content_encryption',
                    cryptoModel: 'v1',
                },
            });
        });

        it('should aggregate multiple performance events with same type and cryptoModel', () => {
            metricHandler.onEvent({
                time: new Date(),
                event: {
                    eventName: 'performance',
                    type: 'content_decryption',
                    cryptoModel: 'v1.5',
                    bytesProcessed: 1024 * 1024, // 1 MB
                    milliseconds: 500,
                },
            });
            metricHandler.onEvent({
                time: new Date(),
                event: {
                    eventName: 'performance',
                    type: 'content_decryption',
                    cryptoModel: 'v1.5',
                    bytesProcessed: 2 * 1024 * 1024, // 2 MB
                    milliseconds: 500,
                },
            });

            jest.advanceTimersByTime(30 * 1000);

            // 3 MB in 1 second = 3 MB/s
            expect(metrics.drive_crypto_speed_histogram.observe).toHaveBeenCalledTimes(1);
            expect(metrics.drive_crypto_speed_histogram.observe).toHaveBeenCalledWith({
                Value: 3,
                Labels: {
                    type: 'content_decryption',
                    cryptoModel: 'v1.5',
                },
            });
        });

        it('should report separate metrics for different type and cryptoModel combinations', () => {
            metricHandler.onEvent({
                time: new Date(),
                event: {
                    eventName: 'performance',
                    type: 'content_encryption',
                    cryptoModel: 'v1',
                    bytesProcessed: 1024 * 1024,
                    milliseconds: 1000,
                },
            });
            metricHandler.onEvent({
                time: new Date(),
                event: {
                    eventName: 'performance',
                    type: 'content_decryption',
                    cryptoModel: 'v1.5',
                    bytesProcessed: 2 * 1024 * 1024,
                    milliseconds: 1000,
                },
            });

            jest.advanceTimersByTime(30 * 1000);

            expect(metrics.drive_crypto_speed_histogram.observe).toHaveBeenCalledTimes(2);
            expect(metrics.drive_crypto_speed_histogram.observe).toHaveBeenCalledWith({
                Value: 1,
                Labels: { type: 'content_encryption', cryptoModel: 'v1' },
            });
            expect(metrics.drive_crypto_speed_histogram.observe).toHaveBeenCalledWith({
                Value: 2,
                Labels: { type: 'content_decryption', cryptoModel: 'v1.5' },
            });
        });

        it('should not report metrics when bytesProcessed is zero', () => {
            metricHandler.onEvent({
                time: new Date(),
                event: {
                    eventName: 'performance',
                    type: 'content_encryption',
                    cryptoModel: 'v1',
                    bytesProcessed: 0,
                    milliseconds: 1000,
                },
            });

            jest.advanceTimersByTime(30 * 1000);

            expect(metrics.drive_crypto_speed_histogram.observe).not.toHaveBeenCalled();
        });

        it('should not report metrics when milliseconds is zero', () => {
            metricHandler.onEvent({
                time: new Date(),
                event: {
                    eventName: 'performance',
                    type: 'content_encryption',
                    cryptoModel: 'v1',
                    bytesProcessed: 1024 * 1024,
                    milliseconds: 0,
                },
            });

            jest.advanceTimersByTime(30 * 1000);

            expect(metrics.drive_crypto_speed_histogram.observe).not.toHaveBeenCalled();
        });

        it('should clear aggregated metrics after sending and report only new data in next interval', () => {
            metricHandler.onEvent({
                time: new Date(),
                event: {
                    eventName: 'performance',
                    type: 'content_encryption',
                    cryptoModel: 'v1',
                    bytesProcessed: 1024 * 1024,
                    milliseconds: 1000,
                },
            });

            jest.advanceTimersByTime(30 * 1000);
            expect(metrics.drive_crypto_speed_histogram.observe).toHaveBeenCalledTimes(1);
            expect(metrics.drive_crypto_speed_histogram.observe).toHaveBeenLastCalledWith({
                Value: 1,
                Labels: { type: 'content_encryption', cryptoModel: 'v1' },
            });

            metricHandler.onEvent({
                time: new Date(),
                event: {
                    eventName: 'performance',
                    type: 'content_encryption',
                    cryptoModel: 'v1',
                    bytesProcessed: 2 * 1024 * 1024,
                    milliseconds: 1000,
                },
            });

            jest.advanceTimersByTime(30 * 1000);
            expect(metrics.drive_crypto_speed_histogram.observe).toHaveBeenCalledTimes(2);
            expect(metrics.drive_crypto_speed_histogram.observe).toHaveBeenLastCalledWith({
                Value: 2,
                Labels: { type: 'content_encryption', cryptoModel: 'v1' },
            });
        });
    });

    describe('unknown event', () => {
        it('should log warning for unknown event types', () => {
            metricHandler.onEvent({
                time: new Date(),
                event: {
                    eventName: 'unknownEvent',
                    someProperty: 'value',
                } as any,
            });

            expect(captureMessage).toHaveBeenCalledWith('Metric event details: unknown metric event', {
                level: 'error',
                tags: {
                    driveSdkMetricEvent: 'unknownEvent',
                },
                extra: {
                    event: { eventName: 'unknownEvent', someProperty: 'value' },
                },
            });
        });
    });

    describe('reduceSizePrecision', () => {
        it('should reduce size precision', () => {
            expect(reduceSizePrecision(0)).toBe(0);
            expect(reduceSizePrecision(1000)).toBe(4095);
            expect(reduceSizePrecision(4095)).toBe(4095);
            expect(reduceSizePrecision(4096)).toBe(100_000);
            expect(reduceSizePrecision(90_000)).toBe(100_000);
            expect(reduceSizePrecision(100_123_456)).toBe(100_100_000);
            expect(reduceSizePrecision(123_456_789)).toBe(123_400_000);
            expect(reduceSizePrecision(123_456_789_000)).toBe(123_456_700_000);
        });
    });
});
