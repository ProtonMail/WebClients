import { TelemetryContentSearchEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import { LoggerProxy } from '../utils/logger';
import { MetricService } from './MetricService';
import { SEARCH_VERSION_V2 } from './interface';

jest.mock('@proton/shared/lib/helpers/metrics', () => ({
    sendTelemetryReport: jest.fn(),
}));

const mockedSendTelemetryReport = jest.mocked(sendTelemetryReport);

const reportedEvents = (event: TelemetryContentSearchEvents) =>
    mockedSendTelemetryReport.mock.calls.map(([report]) => report).filter((report) => report.event === event);

const completed = { hasResults: true, status: 'success', resultCount: 3 } as const;

describe('MetricService', () => {
    let now: number;
    let metricService: MetricService;

    beforeEach(() => {
        mockedSendTelemetryReport.mockClear();
        now = 1_000_000;
        jest.spyOn(Date, 'now').mockImplementation(() => now);
        metricService = new MetricService({} as Api, new LoggerProxy(undefined), SEARCH_VERSION_V2);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('query_completed', () => {
        it('measures the duration from the matching searchStarted', () => {
            metricService.startSearchSession();
            metricService.searchStarted();
            now += 250;
            metricService.searchCompleted(completed);

            const [report] = reportedEvents(TelemetryContentSearchEvents.query_completed);
            expect(report.values).toMatchObject({ durationMs: 250, startTime: 1_000_000, endTime: 1_000_250 });
        });

        it('measures each run within a session from its own start', () => {
            metricService.startSearchSession();
            metricService.searchStarted();
            now += 100;
            metricService.searchCompleted(completed);
            now += 10_000;
            metricService.searchStarted();
            now += 40;
            metricService.searchCompleted(completed);

            const durations = reportedEvents(TelemetryContentSearchEvents.query_completed).map(
                (report) => report.values?.durationMs
            );
            expect(durations).toEqual([100, 40]);
        });

        it('does not report a completion without a start', () => {
            metricService.startSearchSession();
            metricService.searchCompleted(completed);

            expect(reportedEvents(TelemetryContentSearchEvents.query_completed)).toHaveLength(0);
        });

        it('does not report a second completion for the same start', () => {
            metricService.searchStarted();
            metricService.searchCompleted(completed);
            metricService.searchCompleted(completed);

            expect(reportedEvents(TelemetryContentSearchEvents.query_completed)).toHaveLength(1);
        });
    });

    describe('searchCancelled', () => {
        it('drops the pending start', () => {
            metricService.searchStarted();
            metricService.searchCancelled();
            metricService.searchCompleted(completed);

            expect(reportedEvents(TelemetryContentSearchEvents.query_completed)).toHaveLength(0);
        });

        it('drops the session without reporting it', () => {
            metricService.startSearchSession();
            metricService.searchStarted();
            metricService.searchCancelled();
            metricService.endSearchSession('navigation');

            expect(mockedSendTelemetryReport).not.toHaveBeenCalled();
        });
    });
});
