import type { TypedStartListening } from '@reduxjs/toolkit';

import type { CoreEventLoopV6RequiredState } from '@proton/account/coreEventLoop/interface';
import { coreEventLoopV6Listener } from '@proton/account/coreEventLoop/listener';
import type { ProtonDispatch, ProtonThunkArguments } from '@proton/redux-shared-store-types';

interface RequiredState extends CoreEventLoopV6RequiredState {}

type AppStartListening = TypedStartListening<RequiredState, ProtonDispatch<any>, ProtonThunkArguments>;

export const startCoreEventLoopV6Listening = (startListening: AppStartListening) => {
    coreEventLoopV6Listener(startListening);
};
