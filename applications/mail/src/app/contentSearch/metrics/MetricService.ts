import type {
    ContentSearchActionSurface,
    ContentSearchEndReason,
    ContentSearchIndexErrorKind,
    ContentSearchMailboxAddressType,
    ContentSearchResultAction,
    ContentSearchSessionActionType,
    ContentSearchVersion,
    SearchSession,
} from '@proton/encrypted-search/models';
import { type ContentSearchEventStatus, SEARCH_RESULT_SCROLLER_MODE } from '@proton/encrypted-search/models';
import type { TelemetryReport } from '@proton/shared/lib/api/telemetry';
import { getIsBYOEAddress } from '@proton/shared/lib/helpers/address';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { Api } from '@proton/shared/lib/interfaces';
import type { Address } from '@proton/shared/lib/interfaces/Address';

import type { Logger } from '../utils/logger';
import {
    buildIndexCompletedPayload,
    buildQueryCompletedPayload,
    buildResultActionPayload,
    buildResultOpenedPayload,
    buildSearchSessionStartedPayload,
} from './telemetryEventBuilder';

export const getMailboxAddressType = (addresses: Address[] | undefined): ContentSearchMailboxAddressType => {
    if (!addresses || !addresses.length) {
        return 'proton';
    }

    const byoeCount = addresses.filter(getIsBYOEAddress).length;

    if (byoeCount === 0) {
        return 'proton';
    }

    return byoeCount === addresses.length ? 'byoe' : 'mixed';
};

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
        private readonly logger: Logger,
        private readonly searchVersion: ContentSearchVersion
    ) {}

    private recordFirstAction(type: ContentSearchSessionActionType) {
        if (!this.session || this.session.firstActionType !== undefined) {
            return;
        }

        this.logger.info('First action recorded');
        this.session.firstActionAt = Date.now();
        this.session.firstActionType = type;
    }

    private reportTelemetry(payload: TelemetryReport) {
        void sendTelemetryReport({
            ...payload,
            api: this.api,
            delay: true,
        });
    }

    private updateSession(mutate: (session: SearchSession) => void) {
        if (!this.session) {
            return;
        }
        mutate(this.session);
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
        resultCount,
    }: {
        hasResults: boolean;
        status: ContentSearchEventStatus;
        errorKind?: string;
        resultCount: number;
    }) {
        this.logger.info('Search completed');

        const endTime = Date.now();
        const startTime = this.searchStartedAt ?? 0;

        this.searchStartedAt = undefined;

        this.updateSession((session) => {
            session.hasResults = hasResults;
            session.scrollerMode = SEARCH_RESULT_SCROLLER_MODE;
        });

        this.reportTelemetry(
            buildQueryCompletedPayload({
                hasResults,
                status,
                errorKind,
                resultCount,
                durationMs: endTime - startTime,
                startTime,
                endTime,
                searchVersion: this.searchVersion,
            })
        );
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
        this.updateSession((session) => {
            session.resultsOpened += 1;
            session.actionsPerformed += 1;
            if (session.firstOpenedPosition === undefined) {
                session.firstOpenedPosition = resultPosition;
            }
            this.recordFirstAction('open');
        });

        this.reportTelemetry(
            buildResultOpenedPayload({
                isFirstOpen,
                resultPosition,
                messageAgeDays,
                searchVersion: this.searchVersion,
            })
        );
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
        this.updateSession((session) => {
            session.actionsPerformed += 1;
            this.recordFirstAction(action);
        });

        this.reportTelemetry(
            buildResultActionPayload({
                action,
                actionSurface,
                searchVersion: this.searchVersion,
                resultPosition,
            })
        );
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

        this.reportTelemetry(
            buildIndexCompletedPayload({
                status,
                errorKind,
                totalMessagesIndexed,
                durationMs,
                mailboxMessagesTotal,
                mailboxAddressType: getMailboxAddressType(this.addresses),
                searchVersion: this.searchVersion,
            })
        );
    }

    /** Call once when the search UI session ends — see `EncryptedSearchProvider.endSearchSession`. */
    endSearchSession(endReason: ContentSearchEndReason) {
        if (!this.session) {
            return;
        }
        this.logger.info('Search session ended');

        const payload = buildSearchSessionStartedPayload({
            session: this.session,
            endReason,
            searchVersion: this.searchVersion,
        });

        this.session = undefined;

        this.reportTelemetry(payload);
    }
}
