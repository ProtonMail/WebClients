import { TelemetryContentSearchEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { Api } from '@proton/shared/lib/interfaces';

import type {
    ContentSearchEndReason,
    ContentSearchScrollerMode,
    ContentSearchSessionActionType,
    ContentSearchVersion,
} from './models/contentSearchTelemetry';

/**
 * Events shared with mobile's Content Search schema (measurement_group `mail.any.search`), used to compare
 * Encrypted Search (`searchVersion` 'v1', sent from here) against Content Search ('v2', sent separately from
 * mail's contentSearch module). Only sent for mail, since Content Search doesn't exist for calendar/drive.
 */
export const SEARCH_VERSION_V1: ContentSearchVersion = 'v1';

/**
 * One search session covers exactly one search: pagination, sort, and filter changes re-run the
 * search but don't close it. It has to survive outside React (started/stopped from a Redux listener
 * on route/search-state changes) and be reachable from React (list items reporting opens/actions),
 * hence a module-level singleton instead of a context.
 */
interface SearchSession {
    startedAt: number;
    hasResults: boolean;
    scrollerMode?: ContentSearchScrollerMode;
    resultsOpened: number;
    actionsPerformed: number;
    firstActionType?: ContentSearchSessionActionType;
    firstOpenedPosition?: number;
    firstActionAt?: number;
}

let session: SearchSession | undefined;

const recordFirstAction = (type: ContentSearchSessionActionType) => {
    if (!session || session.firstActionType !== undefined) {
        return;
    }
    session.firstActionType = type;
    session.firstActionAt = Date.now();
};

export const startSearchSession = () => {
    session = {
        startedAt: Date.now(),
        hasResults: false,
        resultsOpened: 0,
        actionsPerformed: 0,
    };
};

export const setSearchSessionResults = ({ hasResults }: { hasResults: boolean }) => {
    if (!session) {
        return;
    }
    session.hasResults = hasResults;
};

export const setSearchSessionScroller = (scrollerMode: ContentSearchScrollerMode) => {
    if (!session) {
        return;
    }
    session.scrollerMode = scrollerMode;
};

export const recordSearchResultOpened = ({
    position,
    scrollerMode,
}: {
    position: number;
    scrollerMode: ContentSearchScrollerMode;
}) => {
    if (!session) {
        return;
    }
    session.resultsOpened += 1;
    session.actionsPerformed += 1;
    session.scrollerMode = scrollerMode;
    if (session.firstOpenedPosition === undefined) {
        session.firstOpenedPosition = position;
    }
    recordFirstAction('open');
};

export const recordSearchResultAction = ({ action }: { action: ContentSearchSessionActionType }) => {
    if (!session) {
        return;
    }
    session.actionsPerformed += 1;
    recordFirstAction(action);
};

/** No-ops when no session is active, e.g. clicking "Clear" while not looking at search results. */
export const endSearchSession = (api: Api, endReason: ContentSearchEndReason) => {
    if (!session) {
        return;
    }

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

    session = undefined;

    void sendTelemetryReport({
        api,
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
            searchVersion: SEARCH_VERSION_V1,
        },
        delay: true,
    });
};
