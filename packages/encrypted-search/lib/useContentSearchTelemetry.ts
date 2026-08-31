import { useApi } from '@proton/app-context/useApi';
import { useConfig } from '@proton/app-context/useConfig';
import {
    TelemetryContentSearchEvents,
    TelemetryContentSearchIndexEvents,
    TelemetryMeasurementGroups,
} from '@proton/shared/lib/api/telemetry';
import { APPS } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

import type {
    ContentSearchActionSurface,
    ContentSearchEventStatus,
    ContentSearchPrimaryMatchType,
    ContentSearchResultAction,
    ContentSearchScrollerMode,
    ContentSearchVersion,
} from './models/contentSearchTelemetry';

/**
 * Events shared with mobile's Content Search schema (measurement_group `mail.any.search`), used to compare
 * Encrypted Search (`searchVersion` 'v1', sent from here) against Content Search ('v2', sent separately from
 * mail's contentSearch module). Only sent for mail, since Content Search doesn't exist for calendar/drive.
 */
const SEARCH_VERSION_V1: ContentSearchVersion = 'v1';

export const useContentSearchTelemetry = () => {
    const api = useApi();
    const { APP_NAME } = useConfig();

    const isMailApp = APP_NAME === APPS.PROTONMAIL;

    const sendQueryCompletedReport = ({
        hasResults,
        status,
        errorKind,
        resultCount,
        durationMs,
    }: {
        hasResults: boolean;
        status: ContentSearchEventStatus;
        errorKind?: string;
        resultCount: number;
        durationMs: number;
    }) => {
        if (!isMailApp) {
            return;
        }

        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.contentSearch,
            event: TelemetryContentSearchEvents.query_completed,
            values: {
                resultCount,
                durationMs,
            },
            dimensions: {
                searchSource: 'local',
                hasResults: hasResults.toString(),
                status,
                errorKind,
                searchVersion: SEARCH_VERSION_V1,
            },
            // We want to delay search events so that we cannot correlate search results with user actions
            delay: true,
        });
    };

    const sendResultOpenedReport = ({
        scrollerMode,
        primaryMatchType,
        isFirstOpen,
        resultPosition,
    }: {
        scrollerMode: ContentSearchScrollerMode;
        primaryMatchType: ContentSearchPrimaryMatchType;
        isFirstOpen: boolean;
        resultPosition: number;
    }) => {
        if (!isMailApp) {
            return;
        }

        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.contentSearch,
            event: TelemetryContentSearchEvents.result_opened,
            values: {
                resultPosition,
            },
            dimensions: {
                searchSource: 'local',
                scrollerMode,
                primaryMatchType,
                isFirstOpen: isFirstOpen.toString(),
                searchVersion: SEARCH_VERSION_V1,
            },
            // We want to delay search events so that we cannot correlate search results with user actions
            delay: true,
        });
    };

    const sendResultActionReport = ({
        action,
        actionSurface,
        resultPosition,
    }: {
        action: ContentSearchResultAction;
        actionSurface: ContentSearchActionSurface;
        resultPosition?: number;
    }) => {
        if (!isMailApp) {
            return;
        }

        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.contentSearch,
            event: TelemetryContentSearchEvents.result_action,
            values: {
                resultPosition,
            },
            dimensions: {
                action,
                actionSurface,
                searchSource: 'local',
                searchVersion: SEARCH_VERSION_V1,
            },
            // We want to delay search events so that we cannot correlate search results with user actions
            delay: true,
        });
    };

    const sendMailboxIndexCompletedReport = ({
        status,
        errorKind,
        totalMessagesIndexed,
        durationMs,
        mailboxMessagesTotal,
    }: {
        status: ContentSearchEventStatus;
        errorKind?: string;
        totalMessagesIndexed: number;
        durationMs: number;
        mailboxMessagesTotal?: number;
    }) => {
        if (!isMailApp) {
            return;
        }

        void sendTelemetryReport({
            api,
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
                searchVersion: SEARCH_VERSION_V1,
            },
            delay: false,
        });
    };

    return {
        sendQueryCompletedReport,
        sendResultOpenedReport,
        sendResultActionReport,
        sendMailboxIndexCompletedReport,
    };
};
