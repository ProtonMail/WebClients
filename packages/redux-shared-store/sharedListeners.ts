import type { TypedStartListening } from '@reduxjs/toolkit';

import {
    type AddressKeysState,
    type OrganizationKeyState,
    type SecurityCheckupReduxState,
    type UserInvitationsState,
    type UserKeysState,
    type UserSettingsState,
    addressKeysListener,
    authenticationListener,
    organizationKeysListener,
    organizationThemeListener,
    securityCheckupListener,
    userInvitationsListener,
    userKeysListener,
} from '@proton/account';
import type { ProtonDispatch, ProtonThunkArguments } from '@proton/redux-shared-store-types';

interface RequiredState
    extends AddressKeysState,
        UserKeysState,
        UserSettingsState,
        OrganizationKeyState,
        UserInvitationsState,
        SecurityCheckupReduxState {}

type AppStartListening = TypedStartListening<RequiredState, ProtonDispatch<any>, ProtonThunkArguments>;

export const startSharedListening = (startListening: AppStartListening) => {
    userKeysListener(startListening);
    addressKeysListener(startListening);
    organizationThemeListener(startListening);
    organizationKeysListener(startListening);
    userInvitationsListener(startListening);
    authenticationListener(startListening);
    securityCheckupListener(startListening);
};
