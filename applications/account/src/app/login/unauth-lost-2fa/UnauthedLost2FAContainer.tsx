import { createActorContext } from '@xstate/react';

import type { TwoFactorAuthTypes } from '@proton/shared/lib/authentication/twoFactor';

import { UnauthedLost2FASteps, type UnauthedLost2FAStepsProps } from './UnauthedLost2FASteps';
import type { TotpBackupCodesActorRef } from './state-machine/totpBackupCodeMachine';
import { type Lost2FARecoveryMethods, unauthedLost2FAStateMachine } from './state-machine/unauthedLost2FAStateMachine';
import type { VerifyOwnershipWithEmailActorRef } from './state-machine/verifyOwnershipWithEmailMachine';
import type { VerifyOwnershipWithPhoneActorRef } from './state-machine/verifyOwnershipWithPhoneMachine';

const UnauthedLost2FAContext = createActorContext(unauthedLost2FAStateMachine);

export function useUnauthLost2FA() {
    const { useActorRef, useSelector } = UnauthedLost2FAContext;

    return {
        useUnauthLost2FAActorRef: useActorRef,
        useUnauthLost2FASelector: useSelector,
    };
}

export const useTotpBackupCodesActorRef = () => {
    const { useUnauthLost2FASelector } = useUnauthLost2FA();
    const totpBackupCodesActorRef = useUnauthLost2FASelector(
        (snapshot) => snapshot.children.totpBackupCodes as TotpBackupCodesActorRef
    );

    return totpBackupCodesActorRef;
};

export const useVerifyOwnershipWithEmailActorRef = () => {
    const { useUnauthLost2FASelector } = useUnauthLost2FA();
    const verifyOwnershipWithEmailActorRef = useUnauthLost2FASelector(
        (snapshot) => snapshot.children.verifyOwnershipWithEmail as VerifyOwnershipWithEmailActorRef
    );

    return verifyOwnershipWithEmailActorRef;
};

export const useVerifyOwnershipWithPhoneActorRef = () => {
    const { useUnauthLost2FASelector } = useUnauthLost2FA();
    const verifyOwnershipWithPhoneActorRef = useUnauthLost2FASelector(
        (snapshot) => snapshot.children.verifyOwnershipWithPhone as VerifyOwnershipWithPhoneActorRef
    );

    return verifyOwnershipWithPhoneActorRef;
};

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
    return (
        <UnauthedLost2FAContext.Provider
            logic={unauthedLost2FAStateMachine.provide({})}
            options={{
                input: {
                    recoveryMethods,
                    username: rest.username,
                    twoFactorAuthTypes,
                    onSubmitBackupTotpCode,
                    on2FADisabled,
                    returnTo2FAStep,
                    onResetPassword,
                },
            }}
        >
            <UnauthedLost2FASteps {...rest} />
        </UnauthedLost2FAContext.Provider>
    );
};
