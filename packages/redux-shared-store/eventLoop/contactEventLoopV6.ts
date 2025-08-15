import type { TypedStartListening } from '@reduxjs/toolkit';

import type { ContactEventLoopV6RequiredState } from '@proton/mail/store/contactEventLoop/interface';
import { contactEventLoopV6Listener } from '@proton/mail/store/contactEventLoop/listeners';
import type { ProtonDispatch, ProtonThunkArguments } from '@proton/redux-shared-store-types';

type AppStartListening = TypedStartListening<
    ContactEventLoopV6RequiredState,
    ProtonDispatch<any>,
    ProtonThunkArguments
>;

export const startContactEventLoopV6Listening = (startListening: AppStartListening) => {
    contactEventLoopV6Listener(startListening);
};
