import { useApi } from '@proton/app-context/useApi';
import { useConfig } from '@proton/app-context/useConfig';
import { APPS } from '@proton/shared/lib/constants';
import { getIsBYOEAddress } from '@proton/shared/lib/helpers/address';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { Address } from '@proton/shared/lib/interfaces/Address';

import {
    buildIndexCompletedPayload,
    buildQueryCompletedPayload,
    buildResultActionPayload,
    buildResultOpenedPayload,
} from './contentSearchTelemetryBuilder';
import {
    type ContentSearchActionSurface,
    type ContentSearchEventStatus,
    type ContentSearchIndexErrorKind,
    type ContentSearchMailboxAddressType,
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

        const payload = buildQueryCompletedPayload({
            hasResults,
            status,
            errorKind,
            resultCount,
            durationMs,
            startTime,
            endTime,
            searchVersion: SEARCH_VERSION_V1,
        });

        void sendTelemetryReport({
            ...payload,
            api,
            delay: true,
        });
    };

    const sendResultOpenedReport = ({
        isFirstOpen,
        resultPosition,
        messageAgeDays,
    }: {
        isFirstOpen: boolean;
        resultPosition: number;
        messageAgeDays: number;
    }) => {
        recordSearchResultOpened({ position: resultPosition });

        if (!isMailApp) {
            return;
        }

        const payload = buildResultOpenedPayload({
            isFirstOpen,
            resultPosition,
            messageAgeDays,
            searchVersion: SEARCH_VERSION_V1,
        });

        void sendTelemetryReport({
            ...payload,
            api,
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

        const payload = buildResultActionPayload({
            action,
            actionSurface,
            searchVersion: SEARCH_VERSION_V1,
            resultPosition,
        });

        void sendTelemetryReport({
            ...payload,
            api,
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

        const payload = buildIndexCompletedPayload({
            status,
            errorKind,
            totalMessagesIndexed,
            durationMs,
            mailboxMessagesTotal,
            mailboxAddressType,
            searchVersion: SEARCH_VERSION_V1,
        });

        void sendTelemetryReport({
            ...payload,
            api,
            delay: true,
        });
    };

    return {
        sendQueryCompletedReport,
        sendResultOpenedReport,
        sendResultActionReport,
        sendMailboxIndexCompletedReport,
    };
};
