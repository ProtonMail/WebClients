import type {
    ContentSearchEndReason,
    ContentSearchScrollerMode,
    ContentSearchSessionActionType,
    SearchSession as SearchSessionModel,
} from '@proton/encrypted-search/lib/models';
import { TelemetryContentSearchEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { Api } from '@proton/shared/lib/interfaces';

import type { Logger } from '../utils/logger';
import { SEARCH_SOURCE, SEARCH_VERSION_V2 } from './interface';

export class SearchSession {
    session: SearchSessionModel | undefined;

    constructor(
        private readonly api: Api,
        private readonly logger: Logger
    ) {}

    startSearchSession() {
        this.logger.info('Search session started');
        this.session = {
            startedAt: Date.now(),
            hasResults: false,
            resultsOpened: 0,
            actionsPerformed: 0,
        };
    }

    recordFirstAction(type: ContentSearchSessionActionType) {
        this.logger.info('First action recorded', { type });
        if (!this.session || this.session.firstActionType !== undefined) {
            this.logger.info('First action already recorded');
            return;
        }

        this.session.firstActionAt = Date.now();
        this.session.firstActionType = type;
    }

    setSearchSessionResults(hasResults: boolean) {
        this.logger.info('Search session results set', { hasResults });
        if (!this.session) {
            this.logger.info('No session to set results on');
            return;
        }

        this.session.hasResults = hasResults;
    }

    setSearchSessionScrollerMode(mode: ContentSearchScrollerMode) {
        this.logger.info('Search session scroller mode set', { mode });
        if (!this.session) {
            this.logger.info('No session to set scroller mode on');
            return;
        }

        this.session.scrollerMode = mode;
    }

    recordSearchResultOpened(position: number) {
        this.logger.info('Search result opened', { position });
        if (!this.session) {
            this.logger.info('No session to record result opened on');
            return;
        }

        this.session.resultsOpened += 1;
        this.session.actionsPerformed += 1;
        if (this.session.firstOpenedPosition === undefined) {
            this.session.firstOpenedPosition = position;
        }

        this.recordFirstAction('open');
    }

    recordSearchResultAction(action: ContentSearchSessionActionType) {
        this.logger.info('Search result action recorded', { action });
        if (!this.session) {
            this.logger.info('No session to record result action on');
            return;
        }

        this.session.actionsPerformed += 1;
        this.recordFirstAction(action);
    }

    endSearchSession(endReason: ContentSearchEndReason) {
        this.logger.info('Search session ended', { endReason });
        if (!this.session) {
            this.logger.info('No session to end');
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
