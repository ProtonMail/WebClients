import { useApi } from '@proton/app-context/useApi';
import { useConfig } from '@proton/app-context/useConfig';
import {
    TelemetryContentSearchEvents,
    TelemetryContentSearchIndexEvents,
    TelemetryMeasurementGroups,
} from '@proton/shared/lib/api/telemetry';
import { APPS } from '@proton/shared/lib/constants';
import { getIsBYOEAddress } from '@proton/shared/lib/helpers/address';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { Address } from '@proton/shared/lib/interfaces/Address';

import {
    type ContentSearchActionSurface,
    type ContentSearchEventStatus,
    type ContentSearchIndexErrorKind,
    type ContentSearchMailboxAddressType,
    type ContentSearchPrimaryMatchType,
    type ContentSearchResultAction,
    SEARCH_RESULT_SCROLLER_MODE,
} from './models/contentSearchTelemetry';
import {
    SEARCH_VERSION_V1,
    recordSearchResultAction,
    recordSearchResultOpened,
    setSearchSessionResults,
    setSearchSessionScroller,
} from './searchSession';

/**
 * Classifies an account's addresses for the `mailboxAddressType` dimension, used to break out BYOE
 * (Bring Your Own Email) indexing time from regular Proton-address indexing time.
 */
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

export const useContentSearchTelemetry = () => {
    const api = useApi();
    const { APP_NAME } = useConfig();

    const isMailApp = APP_NAME === APPS.PROTONMAIL;

    const sendQueryCompletedReport = ({
        hasResults,
        status,
        errorKind,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        resultCount,
        durationMs,
        startTime,
        endTime,
    }: {
        hasResults: boolean;
        status: ContentSearchEventStatus;
        errorKind?: string;
        resultCount: number;
        durationMs: number;
        startTime: number;
        endTime: number;
    }) => {
        setSearchSessionResults({ hasResults });
        setSearchSessionScroller(SEARCH_RESULT_SCROLLER_MODE);

        if (!isMailApp) {
            return;
        }

        void sendTelemetryReport({
            api,
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
                searchSource: 'local',
                hasResults: hasResults.toString(),
                status,
                errorKind,
                scrollerMode: SEARCH_RESULT_SCROLLER_MODE,
                searchVersion: SEARCH_VERSION_V1,
            },
            // We want to delay search events so that we cannot correlate search results with user actions
            delay: true,
        });
    };

    const sendResultOpenedReport = ({
        primaryMatchType,
        isFirstOpen,
        resultPosition,
        messageAgeDays,
    }: {
        primaryMatchType: ContentSearchPrimaryMatchType;
        isFirstOpen: boolean;
        resultPosition: number;
        messageAgeDays: number;
    }) => {
        recordSearchResultOpened({ position: resultPosition });

        if (!isMailApp) {
            return;
        }

        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.contentSearch,
            event: TelemetryContentSearchEvents.result_opened,
            values: {
                resultPosition,
                messageAgeDays,
            },
            dimensions: {
                searchSource: 'local',
                scrollerMode: SEARCH_RESULT_SCROLLER_MODE,
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
        recordSearchResultAction({ action });

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
                scrollerMode: SEARCH_RESULT_SCROLLER_MODE,
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
        mailboxAddressType,
    }: {
        status: ContentSearchEventStatus;
        errorKind?: ContentSearchIndexErrorKind;
        totalMessagesIndexed: number;
        durationMs: number;
        mailboxMessagesTotal?: number;
        mailboxAddressType: ContentSearchMailboxAddressType;
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
                mailboxAddressType,
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
