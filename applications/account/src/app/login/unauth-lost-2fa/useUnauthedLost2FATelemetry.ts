import { createContext, useCallback, useContext, useRef } from 'react';

import useApi from '@proton/components/hooks/useApi';
import { TelemetryMeasurementGroups, TelemetryUnauthLost2FAEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport, telemetryReportsBatchQueue } from '@proton/shared/lib/helpers/metrics';

import type { Lost2FARecoveryMethods } from './state-machine/unauthedLost2FAStateMachine';

type Cohort = 'none' | 'single' | 'multiple';

const getCohort = (recoveryMethods: Lost2FARecoveryMethods): Cohort => {
    const count = [recoveryMethods.email, recoveryMethods.phone, recoveryMethods.phrase].filter(Boolean).length;
    if (count === 0) {
        return 'none';
    }
    if (count === 1) {
        return 'single';
    }
    return 'multiple';
};

export type Step =
    | 'request totp backup codes'
    | 'verify ownership with email'
    | 'verify ownership with phone'
    | 'verify ownership with phrase'
    | '2fa-disabled'
    | 'no method to disable 2fa'
    | 'error';

type FlowOutcome = 'signin to continue' | 'return to 2fa step' | 'reset password' | 'totp backup code provided';

interface TelemetryFunctions {
    sendStepLoad: (step: Step) => void;
    sendFlowOutcome: (outcome: FlowOutcome) => void;
}

const UnauthedLost2FATelemetryContext = createContext<TelemetryFunctions>({
    sendStepLoad: () => {},
    sendFlowOutcome: () => {},
});

export const useUnauthedLost2FATelemetryFunctions = (recoveryMethods: Lost2FARecoveryMethods): TelemetryFunctions => {
    const api = useApi();
    const previousStepRef = useRef<Step | 'none'>('none');
    const cohort = getCohort(recoveryMethods);

    const sendStepLoad = useCallback(
        (step: Step) => {
            const dimensions = {
                step,
                previous_step: previousStepRef.current,
                cohort,
                variant: 'A',
            };
            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.accountUnauthLost2FA,
                event: TelemetryUnauthLost2FAEvents.step_load,
                delay: false,
                dimensions,
            });
            previousStepRef.current = step;
        },
        [api, cohort]
    );

    const sendFlowOutcome = useCallback(
        (outcome: FlowOutcome) => {
            const dimensions = {
                outcome,
                final_step: previousStepRef.current,
                cohort,
                variant: 'A',
            };
            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.accountUnauthLost2FA,
                event: TelemetryUnauthLost2FAEvents.flow_outcome,
                delay: false,
                dimensions,
            });
            void telemetryReportsBatchQueue.flush();
        },
        [api, cohort]
    );

    return { sendStepLoad, sendFlowOutcome };
};

export const UnauthedLost2FATelemetryProvider = UnauthedLost2FATelemetryContext.Provider;

export const useUnauthedLost2FATelemetry = () => useContext(UnauthedLost2FATelemetryContext);
