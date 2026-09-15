import type {
    ContentSearchActionSurface,
    ContentSearchEndReason,
    ContentSearchIndexErrorKind,
    ContentSearchResultAction,
    ContentSearchSessionActionType,
    SearchSession,
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

/**
 * Single entry point for content-search metrics
 */
export class MetricService {
    /** Set by `startMailboxIndexing`; `mailbox_index_completed`'s `durationMs` is measured from here. */
    private indexingStartedAt?: number;

    /** Set by `startSearchSession`; `query_completed`'s `durationMs` is measured from here. */
    private searchStartedAt?: number;

    /** Refreshed per render by `useContentSearch` — for `mailbox_index_completed`'s `mailboxAddressType`. */
    public addresses: Address[] | undefined;

    /** The in-progress search session, if one was started — see `startSearchSession`/`endSearchSession`. */
    private session: SearchSession | undefined;

    constructor(
        private readonly api: Api,
        private readonly logger: Logger
    ) {}

    private recordFirstAction(type: ContentSearchSessionActionType) {
        if (!this.session || this.session.firstActionType !== undefined) {
            return;
        }

        this.logger.info('First action recorded');
        this.session.firstActionAt = Date.now();
        this.session.firstActionType = type;
    }

    /** Call once, when the v1+v2 indexing pipeline begins — see `ESAdapter.startIndexingJob`. */
    startIndexing() {
        this.indexingStartedAt = Date.now();
    }

    /**
     * Call once when a search UI session begins — see `SearchService.search`. Closes any session
     * already in progress as `'newSearch'` first, so a caller starting one session after another can
     * never silently drop the previous one's telemetry.
     */
    startSearchSession() {
        this.endSearchSession('newSearch');
        this.logger.info('Search session started');
        this.searchStartedAt = Date.now();
        this.session = {
            startedAt: Date.now(),
            hasResults: false,
            resultsOpened: 0,
            actionsPerformed: 0,
        };
    }

    searchCompleted({
        hasResults,
        status,
        errorKind,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        resultCount,
    }: {
        hasResults: boolean;
        status: ContentSearchEventStatus;
        errorKind?: string;
        resultCount: number;
    }) {
        this.logger.info('Search completed');

        const durationMs = this.searchStartedAt !== undefined ? Date.now() - this.searchStartedAt : 0;
        this.searchStartedAt = undefined;

        if (this.session) {
            this.session.hasResults = hasResults;
            this.session.scrollerMode = SEARCH_RESULT_SCROLLER_MODE;
        }

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

    resultOpened({
        isFirstOpen,
        resultPosition,
        messageAgeDays,
    }: {
        isFirstOpen: boolean;
        resultPosition: number;
        messageAgeDays: number;
    }) {
        this.logger.info('Result opened');

        if (this.session) {
            this.session.resultsOpened += 1;
            this.session.actionsPerformed += 1;
            if (this.session.firstOpenedPosition === undefined) {
                this.session.firstOpenedPosition = resultPosition;
            }
            this.recordFirstAction('open');
        }

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

    resultActionPerformed({
        action,
        actionSurface,
        resultPosition,
    }: {
        action: ContentSearchResultAction;
        actionSurface: ContentSearchActionSurface;
        resultPosition?: number;
    }) {
        this.logger.info('Result action performed');

        if (this.session) {
            this.session.actionsPerformed += 1;
            this.recordFirstAction(action);
        }

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

    mailboxIndexCompleted({
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
        this.logger.info('Mailbox index completed');

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

    /** Call once when the search UI session ends — see `EncryptedSearchProvider.endSearchSession`. */
    endSearchSession(endReason: ContentSearchEndReason) {
        if (!this.session) {
            return;
        }
        this.logger.info('Search session ended');

        const {
            startedAt,
            firstActionAt,
            hasResults,
            scrollerMode,
            resultsOpened,
            actionsPerformed,
            firstActionType,
            firstOpenedPosition,
        } = this.session;
        this.session = undefined;

        void sendTelemetryReport({
            api: this.api,
            measurementGroup: TelemetryMeasurementGroups.contentSearch,
            event: TelemetryContentSearchEvents.search_session_completed,
            dimensions: {
                endReason,
                scrollerMode,
                firstActionType,
                hasResults: hasResults.toString(),
                searchSource: SEARCH_SOURCE,
                searchVersion: SEARCH_VERSION_V2,
            },
            values: {
                resultsOpened,
                actionsPerformed,
                firstOpenedPosition,
                timeToFirstActionMs: firstActionAt !== undefined ? firstActionAt - startedAt : undefined,
                sessionDurationMs: Date.now() - startedAt,
            },
            delay: true,
        });
    }
}
