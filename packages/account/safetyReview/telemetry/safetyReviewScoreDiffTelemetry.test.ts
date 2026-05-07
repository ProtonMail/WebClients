import { renderHook } from '@testing-library/react-hooks';

import { TelemetryMeasurementGroups, TelemetrySafetyReviewScoreDiffEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport, telemetryReportsBatchQueue } from '@proton/shared/lib/helpers/metrics';

import { useSafetyReviewScoreDiffTelemetry } from './useSafetyReviewScoreDiffTelemetry';

const mockApi = jest.fn();

jest.mock('@proton/components/hooks/useApi', () => () => mockApi);
jest.mock('@proton/shared/lib/helpers/metrics', () => ({
    sendTelemetryReport: jest.fn(),
    telemetryReportsBatchQueue: { flush: jest.fn() },
}));

const sendTelemetryReportMock = jest.mocked(sendTelemetryReport);
const flushMock = jest.mocked(telemetryReportsBatchQueue.flush);

beforeEach(() => {
    jest.clearAllMocks();
});

describe('useSafetyReviewScoreDiffTelemetry', () => {
    it('sends score_diff report on unmount with diff=0 when score never changed', () => {
        const { unmount } = renderHook(() => useSafetyReviewScoreDiffTelemetry({ score: 5, loading: false }));

        expect(sendTelemetryReportMock).not.toHaveBeenCalled();

        unmount();

        expect(sendTelemetryReportMock).toHaveBeenCalledWith({
            api: mockApi,
            measurementGroup: TelemetryMeasurementGroups.accountSafetyReviewScoreDiff,
            event: TelemetrySafetyReviewScoreDiffEvents.score_diff,
            dimensions: { variant: 'A', initial_score: '5', diff: '0' },
            delay: false,
        });
    });

    it('sends correct diff when score increased', () => {
        const { unmount, rerender } = renderHook(
            ({ score }: { score: number }) => useSafetyReviewScoreDiffTelemetry({ score, loading: false }),
            { initialProps: { score: 3 } }
        );

        rerender({ score: 7 });
        unmount();

        expect(sendTelemetryReportMock).toHaveBeenCalledWith(
            expect.objectContaining({
                dimensions: { variant: 'A', initial_score: '3', diff: '4' },
            })
        );
    });

    it('sends correct diff when score decreased', () => {
        const { unmount, rerender } = renderHook(
            ({ score }: { score: number }) => useSafetyReviewScoreDiffTelemetry({ score, loading: false }),
            { initialProps: { score: 8 } }
        );

        rerender({ score: 5 });
        unmount();

        expect(sendTelemetryReportMock).toHaveBeenCalledWith(
            expect.objectContaining({
                dimensions: { variant: 'A', initial_score: '8', diff: '-3' },
            })
        );
    });

    it('uses the initial score even after multiple rerenders', () => {
        const { unmount, rerender } = renderHook(
            ({ score }: { score: number }) => useSafetyReviewScoreDiffTelemetry({ score, loading: false }),
            { initialProps: { score: 2 } }
        );

        rerender({ score: 4 });
        rerender({ score: 6 });
        rerender({ score: 9 });
        unmount();

        expect(sendTelemetryReportMock).toHaveBeenCalledWith(
            expect.objectContaining({
                dimensions: { variant: 'A', initial_score: '2', diff: '7' },
            })
        );
    });

    it('flushes the telemetry batch queue on unmount', () => {
        const { unmount } = renderHook(() => useSafetyReviewScoreDiffTelemetry({ score: 0, loading: false }));

        expect(flushMock).not.toHaveBeenCalled();

        unmount();

        expect(flushMock).toHaveBeenCalledTimes(1);
    });

    it('does not send report before unmount', () => {
        const { rerender } = renderHook(
            ({ score }: { score: number }) => useSafetyReviewScoreDiffTelemetry({ score, loading: false }),
            { initialProps: { score: 1 } }
        );

        rerender({ score: 5 });
        rerender({ score: 10 });

        expect(sendTelemetryReportMock).not.toHaveBeenCalled();
    });

    describe('loading flag', () => {
        it('does not send report on unmount when loading never became false', () => {
            const { unmount } = renderHook(() => useSafetyReviewScoreDiffTelemetry({ score: 5, loading: true }));

            unmount();

            expect(sendTelemetryReportMock).not.toHaveBeenCalled();
        });

        it('captures initial score from first render where loading is false', () => {
            const { unmount, rerender } = renderHook(
                ({ score, loading }: { score: number; loading: boolean }) =>
                    useSafetyReviewScoreDiffTelemetry({ score, loading }),
                { initialProps: { score: 3, loading: true } }
            );

            rerender({ score: 7, loading: false });
            unmount();

            expect(sendTelemetryReportMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    dimensions: { variant: 'A', initial_score: '7', diff: '0' },
                })
            );
        });

        it('ignores score changes that occur while loading', () => {
            const { unmount, rerender } = renderHook(
                ({ score, loading }: { score: number; loading: boolean }) =>
                    useSafetyReviewScoreDiffTelemetry({ score, loading }),
                { initialProps: { score: 3, loading: true } }
            );

            rerender({ score: 6, loading: true });
            rerender({ score: 9, loading: false });
            unmount();

            expect(sendTelemetryReportMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    dimensions: { variant: 'A', initial_score: '9', diff: '0' },
                })
            );
        });

        it('does not overwrite initial score if loading toggles back to true', () => {
            const { unmount, rerender } = renderHook(
                ({ score, loading }: { score: number; loading: boolean }) =>
                    useSafetyReviewScoreDiffTelemetry({ score, loading }),
                { initialProps: { score: 4, loading: false } }
            );

            rerender({ score: 8, loading: true });
            rerender({ score: 10, loading: false });
            unmount();

            expect(sendTelemetryReportMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    dimensions: { variant: 'A', initial_score: '4', diff: '6' },
                })
            );
        });
    });
});
