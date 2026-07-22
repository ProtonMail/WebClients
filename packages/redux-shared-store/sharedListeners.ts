import type { TypedStartListening } from '@reduxjs/toolkit';

import {
    type AddressKeysState,
    type EntitlementsState,
    type GroupMembershipsState,
    type KtState,
    type OrganizationKeyState,
    type PasswordReminderReduxState,
    type UserInvitationsState,
    type UserKeysState,
    type UserSettingsState,
    type UserState,
    addressKeysListener,
    authenticationListener,
    entitlementsListener,
    groupMembershipsListener,
    keyBackgroundManagerListener,
    ktListener,
    organizationKeysListener,
    organizationThemeListener,
    passwordReminderListener,
    userInvitationsListener,
    userKeysListener,
    userSettingsListener,
} from '@proton/account';
import {
    type SessionRecoverySliceReducerState,
    sessionRecoveryListener,
} from '@proton/account/recovery/sessionRecovery';
import type { ProtonDispatch, ProtonThunkArguments } from '@proton/redux-shared-store-types';

interface RequiredState
    extends
        AddressKeysState,
        UserKeysState,
        UserState,
        UserSettingsState,
        OrganizationKeyState,
        UserInvitationsState,
        PasswordReminderReduxState,
        EntitlementsState,
        GroupMembershipsState,
        SessionRecoverySliceReducerState,
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
    entitlementsListener(startListening);
    groupMembershipsListener(startListening);
    ktListener(startListening);
    keyBackgroundManagerListener(startListening);
    sessionRecoveryListener(startListening);
    passwordReminderListener(startListening);
};
