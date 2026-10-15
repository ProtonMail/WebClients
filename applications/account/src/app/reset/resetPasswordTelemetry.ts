import { useCallback } from 'react';

import { useApi } from '@proton/app-context/useApi';
import type { RecoveryMethod } from '@proton/shared/lib/api/reset';
import { TelemetryMeasurementGroups, TelemetryResetPasswordEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport, telemetryReportsBatchQueue } from '@proton/shared/lib/helpers/metrics';

interface EventProps {
    step: string;
    method: RecoveryMethod | undefined | 'device-recovery';
}

/**
 * Hook to send reset password flow telemetry via the API.
 */
export const useResetPasswordTelemetry = () => {
    const api = useApi();

    const commonProps = {
        api,
        measurementGroup: TelemetryMeasurementGroups.accountResetPassword,
        delay: false,
    };

    const sendResetPasswordPageLoad = useCallback(() => {
        void sendTelemetryReport({
            ...commonProps,
            dimensions: {
                step: 'entry',
            },
            event: TelemetryResetPasswordEvents.page_load,
        });
    }, [api]);

    const sendResetPasswordPageExit = useCallback(() => {
        void sendTelemetryReport({
            ...commonProps,
            dimensions: {
                step: 'exit',
            },
            event: TelemetryResetPasswordEvents.page_exit,
        });
        void telemetryReportsBatchQueue.flush();
    }, [api]);

    const sendResetPasswordStepLoad = useCallback(
        ({ step }: Omit<EventProps, 'method'>) => {
            void sendTelemetryReport({
                ...commonProps,
                event: TelemetryResetPasswordEvents.step_load,
                dimensions: { step },
            });
        },
        [api]
    );

    const sendResetPasswordRecoveryMethodsRequested = useCallback(
        ({
            hasPasswordResetMethod,
            hasDataRecoveryMethod,
        }: {
            hasPasswordResetMethod: boolean;
            hasDataRecoveryMethod: boolean;
        }) => {
            void sendTelemetryReport({
                ...commonProps,
                event: TelemetryResetPasswordEvents.recovery_methods_requested,
                dimensions: {
                    step: 'entry',
                    hasPasswordResetMethod: String(hasPasswordResetMethod),
                    hasDataRecoveryMethod: String(hasDataRecoveryMethod),
                },
            });
        },
        [api]
    );

    const sendResetPasswordCodeSent = useCallback(
        ({ method, step }: EventProps) => {
            if (method === undefined) {
                return;
            }

            void sendTelemetryReport({
                ...commonProps,
                event: TelemetryResetPasswordEvents.code_sent,
                dimensions: { method, step },
            });
        },
        [api]
    );

    const sendResetPasswordMethodValidated = useCallback(
        ({ method, step }: EventProps) => {
            if (method === undefined) {
                return;
            }

            void sendTelemetryReport({
                ...commonProps,
                event: TelemetryResetPasswordEvents.method_validated,
                dimensions: { method, step },
            });
        },
        [api]
    );

    const sendResetPasswordSuccess = useCallback(
        ({ method, step }: EventProps) => {
            if (method === undefined) {
                return;
            }

            void sendTelemetryReport({
                ...commonProps,
                event: TelemetryResetPasswordEvents.success,
                dimensions: { method, step },
            });
            void telemetryReportsBatchQueue.flush();
        },
        [api]
    );

    const sendResetPasswordFailure = useCallback(
        ({ step, method }: EventProps) => {
            if (method === undefined) {
                return;
            }

            void sendTelemetryReport({
                ...commonProps,
                event: TelemetryResetPasswordEvents.failure,
                dimensions: { step, method },
            });
            void telemetryReportsBatchQueue.flush();
        },
        [api]
    );

    return {
        sendResetPasswordPageLoad,
        sendResetPasswordPageExit,
        sendResetPasswordStepLoad,
        sendResetPasswordRecoveryMethodsRequested,
        sendResetPasswordCodeSent,
        sendResetPasswordMethodValidated,
        sendResetPasswordSuccess,
        sendResetPasswordFailure,
    };
};
