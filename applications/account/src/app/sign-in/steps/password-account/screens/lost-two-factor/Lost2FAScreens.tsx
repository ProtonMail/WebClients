import type { ComponentType } from 'react';

import { Lost2FAContext } from './Lost2FAContext';
import { NoMethodsScreen } from './screens/NoMethodsScreen';
import { TwoFADisabledScreen } from './screens/TwoFADisabledScreen';
import { RequestTotpBackupCodesScreen } from './screens/requestTotpBackupCodes/RequestTotpBackupCodesScreen';
import { VerifyOwnershipWithEmailScreen } from './screens/verifyOwnershipWithEmail/VerifyOwnershipWithEmailScreen';
import { VerifyOwnershipWithPhoneScreen } from './screens/verifyOwnershipWithPhone/VerifyOwnershipWithPhoneScreen';
import { VerifyOwnershipWithPhraseScreen } from './screens/verifyOwnershipWithPhrase/VerifyOwnershipWithPhraseScreen';
import { type Lost2FAScreen, selectLost2FAScreen } from './state-machine/lost2FAStateMachine';

const screens: Record<Lost2FAScreen, ComponentType> = {
    requestBackupCode: RequestTotpBackupCodesScreen,
    verifyOwnershipWithEmail: VerifyOwnershipWithEmailScreen,
    verifyOwnershipWithPhone: VerifyOwnershipWithPhoneScreen,
    verifyOwnershipWithPhrase: VerifyOwnershipWithPhraseScreen,
    twoFactorDisabled: TwoFADisabledScreen,
    noMethod: NoMethodsScreen,
};

/** Picks the screen of the state the flow is in; each screen frames itself with `Lost2FAStepLayout`. */
export const Lost2FAScreens = () => {
    const screen = Lost2FAContext.useSelector(selectLost2FAScreen);
    if (!screen) {
        return null;
    }
    const Screen = screens[screen];
    return <Screen />;
};
