import type { TwoFactorAuthTypes } from '@proton/shared/lib/authentication/twoFactor';

import { UnauthedLost2FAContext } from './UnauthedLost2FAContext';
import { UnauthedLost2FASteps, type UnauthedLost2FAStepsProps } from './UnauthedLost2FASteps';
import { unauthedLost2FAStateMachine } from './state-machine/unauthedLost2FAStateMachine';
import type { Lost2FARecoveryMethods } from './state-machine/unauthedLost2FAStateMachine';
import { UnauthedLost2FATelemetryProvider, useUnauthedLost2FATelemetryFunctions } from './useUnauthedLost2FATelemetry';

interface Props extends UnauthedLost2FAStepsProps {
    twoFactorAuthTypes: TwoFactorAuthTypes;
    recoveryMethods: Lost2FARecoveryMethods;
    onSubmitBackupTotpCode: (backupCode: string) => Promise<void>;
    on2FADisabled: (username: string) => void;
    returnTo2FAStep: () => void;
    onResetPassword: (username: string) => void;
}

export const UnauthedLost2FAContainer = ({
    twoFactorAuthTypes,
    onSubmitBackupTotpCode,
    on2FADisabled,
    returnTo2FAStep,
    onResetPassword,
    recoveryMethods,
    ...rest
}: Props) => {
    const { sendStepLoad, sendFlowOutcome } = useUnauthedLost2FATelemetryFunctions(recoveryMethods);

    const wrappedOnSubmitBackupTotpCode = async (username: string) => {
        sendFlowOutcome('totp backup code provided');
        await onSubmitBackupTotpCode(username);
    };

    const wrappedOn2FADisabled = (username: string) => {
        sendFlowOutcome('signin to continue');
        on2FADisabled(username);
    };

    const wrappedReturnTo2FAStep = () => {
        sendFlowOutcome('return to 2fa step');
        returnTo2FAStep();
    };

    const wrappedOnResetPassword = (username: string) => {
        sendFlowOutcome('reset password');
        onResetPassword(username);
    };

    return (
        <UnauthedLost2FATelemetryProvider value={{ sendStepLoad, sendFlowOutcome }}>
            <UnauthedLost2FAContext.Provider
                logic={unauthedLost2FAStateMachine}
                options={{
                    input: {
                        recoveryMethods,
                        username: rest.username,
                        twoFactorAuthTypes,
                        onSubmitBackupTotpCode: wrappedOnSubmitBackupTotpCode,
                        on2FADisabled: wrappedOn2FADisabled,
                        returnTo2FAStep: wrappedReturnTo2FAStep,
                        onResetPassword: wrappedOnResetPassword,
                    },
                }}
            >
                <UnauthedLost2FASteps {...rest} />
            </UnauthedLost2FAContext.Provider>
        </UnauthedLost2FATelemetryProvider>
    );
};
