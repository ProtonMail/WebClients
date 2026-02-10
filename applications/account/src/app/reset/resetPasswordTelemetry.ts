import { useCallback } from 'react';

import type { RecoveryMethod } from '@proton/components/containers/resetPassword/interface';
import useApi from '@proton/components/hooks/useApi';
import { TelemetryMeasurementGroups, TelemetryResetPasswordEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport, telemetryReportsBatchQueue } from '@proton/shared/lib/helpers/metrics';

/**
 * Hook to send reset password flow telemetry via the API.
 */
export const useResetPasswordTelemetry = () => {
    const api = useApi();

    const sendResetPasswordPageLoad = useCallback(() => {
        void sendTelemetryReport({
            api,
            dimensions: {
                variant: 'A',
            },
            measurementGroup: TelemetryMeasurementGroups.accountResetPassword,
            event: TelemetryResetPasswordEvents.page_load,
            delay: false,
        });
        void telemetryReportsBatchQueue.flush();
    }, [api]);

    const sendResetPasswordRecoveryMethodsRequested = useCallback(
        ({
            hasPasswordResetMethod,
            hasDataRecoveryMethod,
        }: {
            hasPasswordResetMethod: boolean;
            hasDataRecoveryMethod: boolean;
        }) => {
            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.accountResetPassword,
                event: TelemetryResetPasswordEvents.recovery_methods_requested,
                dimensions: {
                    hasPasswordResetMethod: String(hasPasswordResetMethod),
                    hasDataRecoveryMethod: String(hasDataRecoveryMethod),
                    variant: 'A',
                },
                delay: false,
            });
            void telemetryReportsBatchQueue.flush();
        },
        [api]
    );

    const sendResetPasswordCodeSent = useCallback(
        ({ method }: { method: RecoveryMethod | undefined }) => {
            if (method === undefined) {
                return;
            }

            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.accountResetPassword,
                event: TelemetryResetPasswordEvents.code_sent,
                dimensions: { method, variant: 'A' },
                delay: false,
            });
            void telemetryReportsBatchQueue.flush();
        },
        [api]
    );

    const sendResetPasswordMethodValidated = useCallback(
        ({ method }: { method: RecoveryMethod | undefined }) => {
            if (method === undefined) {
                return;
            }

            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.accountResetPassword,
                event: TelemetryResetPasswordEvents.method_validated,
                dimensions: { method, variant: 'A' },
                delay: false,
            });
            void telemetryReportsBatchQueue.flush();
        },
        [api]
    );

    const sendResetPasswordSuccess = useCallback(
        ({ method }: { method: RecoveryMethod | undefined }) => {
            if (method === undefined) {
                return;
            }

            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.accountResetPassword,
                event: TelemetryResetPasswordEvents.success,
                dimensions: { method, variant: 'A' },
                delay: false,
            });
            void telemetryReportsBatchQueue.flush();
        },
        [api]
    );

    const sendResetPasswordFailure = useCallback(
        ({ step, method }: { step: string; method: RecoveryMethod | undefined }) => {
            if (method === undefined) {
                return;
            }

            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.accountResetPassword,
                event: TelemetryResetPasswordEvents.failure,
                dimensions: { step, method, variant: 'A' },
                delay: false,
            });
            void telemetryReportsBatchQueue.flush();
        },
        [api]
    );

    return {
        sendResetPasswordPageLoad,
        sendResetPasswordRecoveryMethodsRequested,
        sendResetPasswordCodeSent,
        sendResetPasswordMethodValidated,
        sendResetPasswordSuccess,
        sendResetPasswordFailure,
    };
};
