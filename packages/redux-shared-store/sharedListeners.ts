import { TypedStartListening } from '@reduxjs/toolkit';

import {
    type AddressKeysState,
    type OrganizationKeyState,
    type UserInvitationsState,
    type UserKeysState,
    addressKeysListener,
    authenticationListener,
    organizationKeysListener,
    organizationThemeListener,
    userInvitationsListener,
    userKeysListener,
} from '@proton/account';

import type { ProtonDispatch, ProtonThunkArguments } from './interface';

interface RequiredState extends AddressKeysState, UserKeysState, OrganizationKeyState, UserInvitationsState {}

type AppStartListening = TypedStartListening<RequiredState, ProtonDispatch<any>, ProtonThunkArguments>;

export const startSharedListening = (startListening: AppStartListening) => {
    userKeysListener(startListening);
    addressKeysListener(startListening);
    organizationThemeListener(startListening);
    organizationKeysListener(startListening);
    userInvitationsListener(startListening);
    authenticationListener(startListening);
};
