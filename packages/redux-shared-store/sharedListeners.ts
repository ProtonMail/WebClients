import type { TypedStartListening } from '@reduxjs/toolkit';

import {
    type AddressKeysState,
    type GroupMembershipsState,
    type KtState,
    type OrganizationKeyState,
    type SecurityCheckupReduxState,
    type UserInvitationsState,
    type UserKeysState,
    type UserSettingsState,
    addressKeysListener,
    authenticationListener,
    groupMembershipsListener,
    keyBackgroundManagerListener,
    ktListener,
    organizationKeysListener,
    organizationThemeListener,
    securityCheckupListener,
    userInvitationsListener,
    userKeysListener,
    userSettingsListener,
} from '@proton/account';
import type { ProtonDispatch, ProtonThunkArguments } from '@proton/redux-shared-store-types';

interface RequiredState
    extends AddressKeysState,
        UserKeysState,
        UserSettingsState,
        OrganizationKeyState,
        UserInvitationsState,
        SecurityCheckupReduxState,
        GroupMembershipsState,
        KtState {}

type AppStartListening = TypedStartListening<RequiredState, ProtonDispatch<any>, ProtonThunkArguments>;

export const startSharedListening = (startListening: AppStartListening) => {
    userKeysListener(startListening);
    userSettingsListener(startListening);
    addressKeysListener(startListening);
    organizationThemeListener(startListening);
    organizationKeysListener(startListening);
    userInvitationsListener(startListening);
    authenticationListener(startListening);
    securityCheckupListener(startListening);
    groupMembershipsListener(startListening);
    ktListener(startListening);
    keyBackgroundManagerListener(startListening);
};
