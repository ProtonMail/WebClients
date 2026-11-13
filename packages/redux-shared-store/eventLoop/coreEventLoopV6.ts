import type { TypedStartListening } from '@reduxjs/toolkit';

import type { CoreEventLoopV6RequiredState } from '@proton/account/coreEventLoop/interface';
import { type CoreEventLoopV6ListenerOptions, coreEventLoopV6Listener } from '@proton/account/coreEventLoop/listener';
import type { ProtonDispatch, ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';

type AppStartListening<ExtraState> = TypedStartListening<
    CoreEventLoopV6RequiredState & ExtraState,
    ProtonDispatch<any>,
    ProtonThunkArguments
>;

export const startCoreEventLoopV6Listening = <ExtraState = {}>(
    startListening: AppStartListening<ExtraState>,
    options?: CoreEventLoopV6ListenerOptions<ExtraState>
) => {
    coreEventLoopV6Listener(startListening, options);
};
