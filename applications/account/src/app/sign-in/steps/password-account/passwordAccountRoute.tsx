import { signInRoute } from '../../routes/signInRoute';
import { PasswordAccountContext } from './PasswordAccountContext';
import { ClaimedAddressCreateScreen } from './screens/claimed-address/ClaimedAddressCreateScreen';
import { ClaimedAddressDoneScreen } from './screens/claimed-address/ClaimedAddressDoneScreen';
import { NewPasswordScreen } from './screens/new-password/NewPasswordScreen';
import { TwoFactorScreen } from './screens/two-factor/TwoFactorScreen';
import { UnlockScreen } from './screens/unlock/UnlockScreen';
import { selectScreen, selectScreenActor } from './state-machine/passwordAccountStateMachine';

/**
 * The password account flow runs as a child of the sign-in machine (`passwordAccountStateMachine`), which owns the
 * requests and navigation; its `screen` picks the screen.
 */
export const passwordAccountRoute = signInRoute({
    provider: PasswordAccountContext.Provider,
    // Lost 2FA is its own machine's, with its own route
    screenActor: selectScreenActor,
    screen: (snapshot) => {
        const screen = selectScreen(snapshot);
        return screen === 'lostTwoFactor' ? undefined : screen;
    },
    screens: {
        twoFactor: TwoFactorScreen,
        unlock: UnlockScreen,
        newPassword: NewPasswordScreen,
        claimedAddressCreate: ClaimedAddressCreateScreen,
        claimedAddressDone: ClaimedAddressDoneScreen,
    },
});
