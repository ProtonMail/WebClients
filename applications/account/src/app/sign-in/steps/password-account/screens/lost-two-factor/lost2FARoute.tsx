import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { signInRoute } from '../../../../routes/signInRoute';
import { Lost2FAContext } from './Lost2FAContext';
import { NoMethodsScreen } from './screens/NoMethodsScreen';
import { TwoFADisabledScreen } from './screens/TwoFADisabledScreen';
import { RequestTotpBackupCodesScreen } from './screens/requestTotpBackupCodes/RequestTotpBackupCodesScreen';
import { VerifyOwnershipWithEmailScreen } from './screens/verifyOwnershipWithEmail/VerifyOwnershipWithEmailScreen';
import { VerifyOwnershipWithPhoneScreen } from './screens/verifyOwnershipWithPhone/VerifyOwnershipWithPhoneScreen';
import { VerifyOwnershipWithPhraseScreen } from './screens/verifyOwnershipWithPhrase/VerifyOwnershipWithPhraseScreen';
import { selectLost2FARecoveryMethods, selectLost2FAScreen } from './state-machine/lost2FAStateMachine';
import { Lost2FATelemetryProvider, flowOutcomes, useLost2FATelemetryFunctions } from './useLost2FATelemetry';

/** The flow's telemetry around its screens, which reports each screen and its outcome; it starts again for each flow. */
const Lost2FAFrame = ({ children }: { children: ReactNode }) => {
    const actorRef = Lost2FAContext.useActorRef();
    const recoveryMethods = Lost2FAContext.useSelector(selectLost2FARecoveryMethods);
    const { sendStepLoad, sendFlowOutcome } = useLost2FATelemetryFunctions(recoveryMethods);

    useEffect(() => {
        const subscriptions = [
            actorRef.on('lost2FA.ended', ({ payload }) => sendFlowOutcome(flowOutcomes[payload.outcome])),
            actorRef.on('lost2FA.backupCodeProvided', () => sendFlowOutcome('totp backup code provided')),
        ];
        return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
    }, [actorRef, sendFlowOutcome]);

    return <Lost2FATelemetryProvider value={{ sendStepLoad, sendFlowOutcome }}>{children}</Lost2FATelemetryProvider>;
};

/**
 * The lost-2FA flow runs as a child of the password account flow. Back stays on screen while a code is checked, when
 * the flow ignores it.
 */
export const lost2FARoute = signInRoute({
    provider: Lost2FAContext.Provider,
    Frame: Lost2FAFrame,
    screen: selectLost2FAScreen,
    screens: {
        requestBackupCode: RequestTotpBackupCodesScreen,
        verifyOwnershipWithEmail: VerifyOwnershipWithEmailScreen,
        verifyOwnershipWithPhone: VerifyOwnershipWithPhoneScreen,
        verifyOwnershipWithPhrase: VerifyOwnershipWithPhraseScreen,
        twoFactorDisabled: TwoFADisabledScreen,
        noMethod: NoMethodsScreen,
    },
});
