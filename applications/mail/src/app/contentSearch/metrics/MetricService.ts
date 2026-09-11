import type { ContentSearchActionSurface, ContentSearchResultAction } from '@proton/encrypted-search/models';
import {
    type ContentSearchEventStatus,
    type ContentSearchSearchSource,
    type ContentSearchVersion,
    SEARCH_RESULT_PRIMARY_MATCH_TYPE,
    SEARCH_RESULT_SCROLLER_MODE,
} from '@proton/encrypted-search/models';
import { TelemetryContentSearchEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { Api } from '@proton/shared/lib/interfaces';

import type { Logger } from '../utils/logger';

const SEARCH_VERSION_V2: ContentSearchVersion = 'v2';
const SEARCH_SOURCE: ContentSearchSearchSource = 'local';

export class MetricService {
    constructor(
        private readonly api: Api,
        private readonly logger: Logger
    ) {}

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
}
