import type {
    ContentSearchActionSurface,
    ContentSearchIndexErrorKind,
    ContentSearchResultAction,
} from '@proton/encrypted-search/models';
import {
    type ContentSearchEventStatus,
    SEARCH_RESULT_PRIMARY_MATCH_TYPE,
    SEARCH_RESULT_SCROLLER_MODE,
} from '@proton/encrypted-search/models';
import { getMailboxAddressType } from '@proton/encrypted-search/useContentSearchTelemetry';
import {
    TelemetryContentSearchEvents,
    TelemetryContentSearchIndexEvents,
    TelemetryMeasurementGroups,
} from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { Api } from '@proton/shared/lib/interfaces';
import type { Address } from '@proton/shared/lib/interfaces/Address';

import type { Logger } from '../utils/logger';
import { SEARCH_SOURCE, SEARCH_VERSION_V2 } from './interface';

export class MetricService {
    /** Set by `startMailboxIndexing`; `mailbox_index_completed`'s `durationMs` is measured from here. */
    private indexingStartedAt?: number;

    /** Refreshed per render by `useContentSearch` — for `mailbox_index_completed`'s `mailboxAddressType`. */
    public addresses: Address[] | undefined;

    constructor(
        private readonly api: Api,
        private readonly logger: Logger
    ) {}

    /** Call once, when the v1+v2 indexing pipeline begins — see `ESAdapter.startIndexingJob`. */
    startMailboxIndexing() {
        this.indexingStartedAt = Date.now();
    }

    sendQueryCompletedReport({
        hasResults,
        status,
        errorKind,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        resultCount,
        durationMs,
    }: {
        hasResults: boolean;
        status: ContentSearchEventStatus;
        errorKind?: string;
        resultCount: number;
        durationMs: number;
    }) {
        this.logger.info('sending query completed report');

        void sendTelemetryReport({
            api: this.api,
            measurementGroup: TelemetryMeasurementGroups.contentSearch,
            event: TelemetryContentSearchEvents.query_completed,
            dimensions: {
                status,
                errorKind,
                hasResults: hasResults.toString(),
                searchSource: SEARCH_SOURCE,
                searchVersion: SEARCH_VERSION_V2,
            },
            values: {
                // TODO this can be changed once INWEB-1184 is fixed
                resultCount: 0,
                durationMs,
            },
            delay: true,
        });
    }

    sendResultOpenedReport({
        isFirstOpen,
        resultPosition,
        messageAgeDays,
    }: {
        isFirstOpen: boolean;
        resultPosition: number;
        messageAgeDays: number;
    }) {
        this.logger.info('sending result opened report');

        void sendTelemetryReport({
            api: this.api,
            measurementGroup: TelemetryMeasurementGroups.contentSearch,
            event: TelemetryContentSearchEvents.result_opened,
            dimensions: {
                scrollerMode: SEARCH_RESULT_SCROLLER_MODE,
                primaryMatchType: SEARCH_RESULT_PRIMARY_MATCH_TYPE,
                isFirstOpen: isFirstOpen.toString(),
                searchSource: SEARCH_SOURCE,
                searchVersion: SEARCH_VERSION_V2,
            },
            values: { resultPosition, messageAgeDays },
            delay: true,
        });
    }

    sendResultActionReport({
        action,
        actionSurface,
        resultPosition,
    }: {
        action: ContentSearchResultAction;
        actionSurface: ContentSearchActionSurface;
        resultPosition?: number;
    }) {
        this.logger.info('sending result action report');

        void sendTelemetryReport({
            api: this.api,
            measurementGroup: TelemetryMeasurementGroups.contentSearch,
            event: TelemetryContentSearchEvents.result_action,
            dimensions: {
                action,
                actionSurface,
                searchSource: SEARCH_SOURCE,
                scrollerMode: SEARCH_RESULT_SCROLLER_MODE,
                searchVersion: SEARCH_VERSION_V2,
            },
            values: {
                resultPosition,
            },
            delay: true,
        });
    }

    sendMailboxIndexCompletedReport({
        status,
        errorKind,
        totalMessagesIndexed,
        mailboxMessagesTotal,
    }: {
        status: ContentSearchEventStatus;
        errorKind?: ContentSearchIndexErrorKind;
        totalMessagesIndexed: number;
        mailboxMessagesTotal?: number;
    }) {
        const durationMs = this.indexingStartedAt !== undefined ? Date.now() - this.indexingStartedAt : 0;
        this.indexingStartedAt = undefined;

        void sendTelemetryReport({
            api: this.api,
            measurementGroup: TelemetryMeasurementGroups.contentSearchIndex,
            event: TelemetryContentSearchIndexEvents.mailbox_index_completed,
            dimensions: {
                status,
                errorKind,
                mailboxAddressType: getMailboxAddressType(this.addresses),
                searchVersion: SEARCH_VERSION_V2,
            },
            values: {
                totalMessagesIndexed,
                durationMs,
                mailboxMessagesTotal,
            },
            delay: true,
        });
    }
}
