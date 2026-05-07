import { useCallback, useEffect, useRef } from 'react';

import useApi from '@proton/components/hooks/useApi';
import { TelemetryMeasurementGroups, TelemetrySafetyReviewScoreDiffEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport, telemetryReportsBatchQueue } from '@proton/shared/lib/helpers/metrics';

const variant = 'A';

export const useSafetyReviewScoreDiffTelemetry = ({ score, loading }: { score: number; loading: boolean }) => {
    const api = useApi();

    const initialScoreRef = useRef<number | null>(null);
    const currentScoreRef = useRef(score);
    currentScoreRef.current = score;

    useEffect(() => {
        if (loading || initialScoreRef.current !== null) {
            return;
        }

        initialScoreRef.current = score;
    }, [loading, score]);

    const sendScoreDiff = useCallback(
        ({ initial_score, diff }: { initial_score: number; diff: number }) => {
            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.accountSafetyReviewScoreDiff,
                event: TelemetrySafetyReviewScoreDiffEvents.score_diff,
                dimensions: {
                    variant,
                    initial_score: String(initial_score),
                    diff: String(diff),
                },
                delay: false,
            });

            void telemetryReportsBatchQueue.flush();
        },
        [api]
    );

    useEffect(() => {
        return () => {
            if (initialScoreRef.current === null) {
                return;
            }
            sendScoreDiff({
                initial_score: initialScoreRef.current,
                diff: currentScoreRef.current - initialScoreRef.current,
            });
        };
    }, []);
};
