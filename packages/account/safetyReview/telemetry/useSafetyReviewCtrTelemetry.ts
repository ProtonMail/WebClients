import { useCallback, useEffect, useMemo } from 'react';

import useApi from '@proton/components/hooks/useApi';
import { TelemetryMeasurementGroups, TelemetrySafetyReviewCtrEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport, telemetryReportsBatchQueue } from '@proton/shared/lib/helpers/metrics';

import type { RecoveryActionItem, RecoveryActionItemsIds } from '../recoveryState/recoveryState';

const variant = 'A';

export const useSafetyReviewCtrTelemetry = ({ activeStep }: { activeStep: RecoveryActionItem }) => {
    const api = useApi();

    const commonProps = useMemo(
        () => ({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountSafetyReviewCtr,
            delay: false,
        }),
        [api]
    );

    const sendStepLoad = useCallback(
        (step: RecoveryActionItemsIds) => {
            void sendTelemetryReport({
                ...commonProps,
                event: TelemetrySafetyReviewCtrEvents.step_load,
                dimensions: { step, variant },
            });

            void telemetryReportsBatchQueue.flush();
        },
        [commonProps]
    );

    const sendStepExit = useCallback(
        (step: RecoveryActionItemsIds) => {
            void sendTelemetryReport({
                ...commonProps,
                event: TelemetrySafetyReviewCtrEvents.step_exit,
                dimensions: { step, variant },
            });
        },
        [commonProps]
    );

    const sendStepSkip = useCallback(
        (step: RecoveryActionItemsIds) => {
            void sendTelemetryReport({
                ...commonProps,
                event: TelemetrySafetyReviewCtrEvents.step_skip,
                dimensions: { step, variant },
            });
        },
        [commonProps]
    );

    const sendStepSuccess = useCallback(
        (step: RecoveryActionItemsIds) => {
            void sendTelemetryReport({
                ...commonProps,
                event: TelemetrySafetyReviewCtrEvents.step_success,
                dimensions: { step, variant },
            });
        },
        [commonProps]
    );

    const activeStepId = activeStep?.id;
    useEffect(() => {
        if (!activeStepId) {
            return;
        }
        sendStepLoad(activeStepId);
        return () => {
            sendStepExit(activeStepId);
        };
    }, [activeStepId]);

    return { sendStepLoad, sendStepExit, sendStepSkip, sendStepSuccess };
};
