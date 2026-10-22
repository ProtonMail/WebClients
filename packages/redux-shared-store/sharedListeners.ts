import type { TypedStartListening } from '@reduxjs/toolkit';

import type { AddressKeysState } from '@proton/account/addressKeys';
import { keyBackgroundManagerListener } from '@proton/account/addressKeys/keyBackgroundListener';
import { addressKeysListener } from '@proton/account/addressKeys/listener';
import { authenticationListener } from '@proton/account/authenticationService/authenticationListener';
import type { AvailableAppsState } from '@proton/account/availableApps';
import { availableAppsListener } from '@proton/account/availableApps/listener';
import type { EntitlementsState } from '@proton/account/entitlements';
import { entitlementsListener } from '@proton/account/entitlements/listenerV5';
import type { GroupMembershipsState } from '@proton/account/groupMemberships';
import { groupMembershipsListener } from '@proton/account/groupMemberships/listener';
import type { KtState } from '@proton/account/kt';
import { ktListener } from '@proton/account/kt/listener';
import { organizationThemeListener } from '@proton/account/organization/theme/listener';
import type { OrganizationKeyState } from '@proton/account/organizationKey';
import { organizationKeysListener } from '@proton/account/organizationKey/listener';
import type { PasswordReminderReduxState } from '@proton/account/passwordReminder';
import { passwordReminderListener } from '@proton/account/passwordReminder/listener';
import {
    type SessionRecoverySliceReducerState,
    sessionRecoveryListener,
} from '@proton/account/recovery/sessionRecovery';
import type { UserState } from '@proton/account/user';
import type { UserInvitationsState } from '@proton/account/userInvitations';
import { userInvitationsListener } from '@proton/account/userInvitations';
import type { UserKeysState } from '@proton/account/userKeys';
import { userKeysListener } from '@proton/account/userKeys/listener';
import type { UserSettingsState } from '@proton/account/userSettings';
import { userSettingsListener } from '@proton/account/userSettings/listener';
import type { ProtonDispatch, ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';

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
        KtState,
        AvailableAppsState {}

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
    availableAppsListener(startListening);
};
