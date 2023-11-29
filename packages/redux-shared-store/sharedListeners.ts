import { TypedStartListening } from '@reduxjs/toolkit';

import {
    AddressKeysState,
    OrganizationKeyState,
    UserInvitationsState,
    UserKeysState,
    addressKeysListener,
    organizationKeysListener,
    userInvitationsListener,
    userKeysListener,
} from '@proton/account';

import type { ProtonDispatch, ProtonThunkArguments } from './interface';

interface RequiredState extends AddressKeysState, UserKeysState, OrganizationKeyState, UserInvitationsState {}

type AppStartListening = TypedStartListening<RequiredState, ProtonDispatch<any>, ProtonThunkArguments>;

export const startSharedListening = (startListening: AppStartListening) => {
    userKeysListener(startListening);
    addressKeysListener(startListening);
    organizationKeysListener(startListening);
    userInvitationsListener(startListening);
};
