import type {
    MetricAPIRetrySucceededEvent,
    MetricDecryptionErrorEvent,
    MetricDownloadEvent,
    MetricEvent,
    MetricUploadEvent,
    MetricVerificationErrorEvent,
    MetricVolumeEventsSubscriptionsChangedEvent,
} from '@protontech/drive-sdk';
import { MetricVolumeType } from '@protontech/drive-sdk';
import type { MetricRecord } from '@protontech/drive-sdk/dist/telemetry';
import {
    ConsoleLogHandler,
    LogFilter,
    LogLevel,
    MemoryLogHandler,
    Telemetry,
} from '@protontech/drive-sdk/dist/telemetry';

import metrics from '@proton/metrics';

import { SentryLogHandler } from './logHandlers/sentryLogHandler';

export type UserPlan = 'free' | 'paid' | 'anonymous' | 'unknown';

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

class MetricHandler {
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
        } else if (metric.event.eventName === 'volumeEventsSubscriptionsChanged') {
            this.onVolumeEventsSubscriptionsChanged(metric.event);
        } else {
            console.warn(`[metric] unknown metric event: ${JSON.stringify(metric.event)}`);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private onApiRetrySucceeded(metric: MetricAPIRetrySucceededEvent) {
        // TODO: create a metric for this
    }

    private onUpload(metric: MetricUploadEvent) {
        metrics.drive_upload_success_rate_total.increment({
            status: !metric.error ? 'success' : 'failure',
            shareType: this.getShareType(metric.volumeType),
            retry: 'false', // TODO: we need to wire context from the app
            initiator: 'explicit',
        });

        // TODO: handle error specific metrics
    }

    private onDownload(metric: MetricDownloadEvent) {
        metrics.drive_download_success_rate_total.increment({
            status: !metric.error ? 'success' : 'failure',
            shareType: this.getShareType(metric.volumeType),
            retry: 'false', // TODO: we need to wire context from the app
        });

        // TODO: handle error specific metrics
    }

    private onDecryptionError(metric: MetricDecryptionErrorEvent) {
        // TODO: upgrade metrics to include field instead of entity, and use volume type instead
        let entity: 'share' | 'node' | 'content' = 'node';
        if (metric.field === 'shareKey') {
            entity = 'share';
        }
        if (metric.field === 'nodeContentKey' || metric.field === 'content') {
            entity = 'content';
        }

        metrics.drive_integrity_decryption_errors_total.increment({
            entity,
            shareType: this.getShareType(metric.volumeType),
            fromBefore2024: this.getYesNoUnknown(metric.fromBefore2024),
        });

        // TODO: handle erroring users
        // TODO: send metric.error to Sentry as well
    }

    private onVerificationError(metric: MetricVerificationErrorEvent) {
        // TODO: upgrade metrics to include field instead of email, and use volume type instead
        const verificationKey = {
            shareKey: 'ShareAddress',
            nodeKey: 'SignatureEmail',
            nodeName: 'NameSignatureEmail',
            nodeHashKey: 'NodeKey',
            nodeExtendedAttributes: 'SignatureEmail',
            nodeContentKey: 'NodeKey',
            content: 'SignatureEmail',
        }[metric.field] as 'ShareAddress' | 'NameSignatureEmail' | 'SignatureEmail' | 'NodeKey';

        metrics.drive_integrity_verification_errors_total.increment({
            shareType: this.getShareType(metric.volumeType),
            verificationKey,
            addressMatchingDefaultShare: this.getYesNoUnknown(metric.addressMatchingDefaultShare),
            fromBefore2024: this.getYesNoUnknown(metric.fromBefore2024),
        });

        // TODO: handle erroring users
    }

    private onVolumeEventsSubscriptionsChanged(metric: MetricVolumeEventsSubscriptionsChangedEvent) {
        // Anonymous user will not listen to volumes.
        // TODO: upgrade metric to inlucde unknown as user plan
        if (this.userPlan === 'anonymous' || this.userPlan === 'unknown') {
            return;
        }

        metrics.drive_volume_events_subscriptions_histogram.observe({
            Value: metric.numberOfVolumeSubscriptions,
            Labels: {
                userPlan: this.userPlan,
            },
        });
    }

    // Context is volume-centric, while share type is share-centric.
    // That is incompatible. We need to upgrade metrics to be volume-centric.
    // For now, we simply report devices or photos as main as well.
    // New photo volume or public sharing is not supported by the SDK,
    // so such even will not come.
    private getShareType(context?: MetricVolumeType): 'main' | 'shared' {
        if (context === MetricVolumeType.OwnVolume) {
            return 'main';
        }
        if (context === MetricVolumeType.Shared) {
            return 'shared';
        }
        if (context === MetricVolumeType.SharedPublic) {
            return 'shared';
        }
        // If context is not known, we consider it is shared.
        // For new metric, we should have unknown state as well.
        return 'shared';
    }

    private getYesNoUnknown(value: boolean | undefined): 'yes' | 'no' | 'unknown' {
        if (value === undefined) {
            return 'unknown';
        }
        return value ? 'yes' : 'no';
    }
}
