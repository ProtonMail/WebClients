import type { ContentSearchEventStatus, ContentSearchIndexErrorKind } from '@proton/encrypted-search/models';
import type { TelemetryReport } from '@proton/shared/lib/api/telemetry';
import {
    TelemetryContentSearchEvents,
    TelemetryContentSearchIndexEvents,
    TelemetryMeasurementGroups,
} from '@proton/shared/lib/api/telemetry';

import type {} from './interface';
import {
    type ContentSearchActionSurface,
    type ContentSearchEndReason,
    type ContentSearchMailboxAddressType,
    type ContentSearchResultAction,
    type ContentSearchVersion,
    SEARCH_RESULT_PRIMARY_MATCH_TYPE,
    SEARCH_RESULT_SCROLLER_MODE,
    type SearchSession,
} from './interface';

export const buildResultActionPayload = ({
    action,
    actionSurface,
    searchVersion,
    resultPosition,
}: {
    action: ContentSearchResultAction;
    actionSurface: ContentSearchActionSurface;
    searchVersion: ContentSearchVersion;
    resultPosition?: number;
}): TelemetryReport => {
    return {
        measurementGroup: TelemetryMeasurementGroups.contentSearch,
        event: TelemetryContentSearchEvents.result_action,
        values: { resultPosition },
        dimensions: {
            action,
            actionSurface,
            searchVersion,
            searchSource: 'local',
            scrollerMode: SEARCH_RESULT_SCROLLER_MODE,
        },
    };
};

export const buildIndexCompletedPayload = ({
    status,
    errorKind,
    totalMessagesIndexed,
    durationMs,
    mailboxMessagesTotal,
    mailboxAddressType,
    searchVersion,
}: {
    status: ContentSearchEventStatus;
    errorKind?: ContentSearchIndexErrorKind;
    totalMessagesIndexed: number;
    durationMs: number;
    mailboxMessagesTotal?: number;
    mailboxAddressType: ContentSearchMailboxAddressType;
    searchVersion: ContentSearchVersion;
}): TelemetryReport => {
    return {
        measurementGroup: TelemetryMeasurementGroups.contentSearchIndex,
        event: TelemetryContentSearchIndexEvents.mailbox_index_completed,
        values: {
            totalMessagesIndexed,
            durationMs,
            mailboxMessagesTotal,
        },
        dimensions: {
            status,
            errorKind,
            mailboxAddressType,
            searchVersion,
        },
    };
};

export const buildResultOpenedPayload = ({
    isFirstOpen,
    resultPosition,
    messageAgeDays,
    searchVersion,
}: {
    isFirstOpen: boolean;
    resultPosition: number;
    messageAgeDays: number;
    searchVersion: ContentSearchVersion;
}): TelemetryReport => {
    return {
        measurementGroup: TelemetryMeasurementGroups.contentSearch,
        event: TelemetryContentSearchEvents.result_opened,
        values: {
            resultPosition,
            messageAgeDays,
        },
        dimensions: {
            searchSource: 'local',
            scrollerMode: SEARCH_RESULT_SCROLLER_MODE,
            primaryMatchType: SEARCH_RESULT_PRIMARY_MATCH_TYPE,
            isFirstOpen: isFirstOpen.toString(),
            searchVersion,
        },
    };
};

export const buildQueryCompletedPayload = ({
    hasResults,
    status,
    errorKind,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    resultCount,
    durationMs,
    startTime,
    endTime,
    searchVersion,
}: {
    hasResults: boolean;
    status: ContentSearchEventStatus;
    errorKind?: string;
    resultCount: number;
    durationMs: number;
    startTime: number;
    endTime: number;
    searchVersion: ContentSearchVersion;
}): TelemetryReport => {
    return {
        measurementGroup: TelemetryMeasurementGroups.contentSearch,
        event: TelemetryContentSearchEvents.query_completed,
        values: {
            // TODO this can be changed once INWEB-1184 is fixed
            resultCount: 0,
            durationMs,
            startTime,
            endTime,
        },
        dimensions: {
            status,
            errorKind,
            hasResults: hasResults.toString(),
            scrollerMode: SEARCH_RESULT_SCROLLER_MODE,
            searchSource: 'local',
            searchVersion,
        },
    };
};

export const buildSearchSessionStartedPayload = ({
    session,
    endReason,
    searchVersion,
}: {
    session: SearchSession;
    endReason: ContentSearchEndReason;
    searchVersion: ContentSearchVersion;
}): TelemetryReport => {
    const {
        startedAt,
        firstActionAt,
        hasResults,
        scrollerMode,
        resultsOpened,
        actionsPerformed,
        firstActionType,
        firstOpenedPosition,
    } = session;

    return {
        measurementGroup: TelemetryMeasurementGroups.contentSearch,
        event: TelemetryContentSearchEvents.search_session_completed,
        values: {
            resultsOpened,
            actionsPerformed,
            firstOpenedPosition,
            timeToFirstActionMs: firstActionAt !== undefined ? firstActionAt - startedAt : undefined,
            sessionDurationMs: Date.now() - startedAt,
        },
        dimensions: {
            endReason,
            scrollerMode,
            firstActionType,
            hasResults: hasResults.toString(),
            searchSource: 'local',
            searchVersion,
        },
    };
};
