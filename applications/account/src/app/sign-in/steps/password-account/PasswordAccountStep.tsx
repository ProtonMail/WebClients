import type { ComponentType } from 'react';

import LoaderPage from '@proton/components/containers/app/LoaderPage';

import { SignInContext } from '../../wizard/SignInContext';
import { PasswordAccountContext } from './PasswordAccountContext';
import { LostTwoFactorScreen } from './screens/lost-two-factor/LostTwoFactorScreen';
import { NewPasswordScreen } from './screens/new-password/NewPasswordScreen';
import { TwoFactorScreen } from './screens/two-factor/TwoFactorScreen';
import { UnlockScreen } from './screens/unlock/UnlockScreen';
import type { PasswordAccountScreen } from './state-machine/passwordAccountStateMachine';

const screens: Record<PasswordAccountScreen, ComponentType> = {
    twoFactor: TwoFactorScreen,
    lostTwoFactor: LostTwoFactorScreen,
    unlock: UnlockScreen,
    newPassword: NewPasswordScreen,
};

const PasswordAccountScreens = () => {
    const screen = PasswordAccountContext.useSelector((snapshot) => snapshot.context.screen);
    if (!screen) {
        return null;
    }
    const Screen = screens[screen];
    return <Screen />;
};

/**
 * The password account flow runs as a child of the sign-in machine (`passwordAccountStateMachine`), which owns the
 * requests and navigation; this picks the screen for its `screen`.
 */
export const PasswordAccountStep = () => {
    const passwordAccountRef = SignInContext.useSelector((snapshot) => snapshot.children.passwordAccount);

    // Expected, and not seen in practice: back or a failure ends the flow in the same transition that moves to the
    // credentials form, and a sign-in hands the session to the app first, which navigates away before a paint
    if (!passwordAccountRef) {
        return <LoaderPage />;
    }

    return (
        <PasswordAccountContext.Provider value={passwordAccountRef}>
            <PasswordAccountScreens />
        </PasswordAccountContext.Provider>
    );
};
