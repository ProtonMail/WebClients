import type { TypedStartListening } from '@reduxjs/toolkit';

import type { MailEventLoopV6RequiredState } from '@proton/mail/store/mailEventLoop/interface';
import { mailEventLoopV6Listener } from '@proton/mail/store/mailEventLoop/listener';
import type { ProtonDispatch, ProtonThunkArguments } from '@proton/redux-shared-store-types';

type AppStartListening = TypedStartListening<MailEventLoopV6RequiredState, ProtonDispatch<any>, ProtonThunkArguments>;

export const startMailEventLoopV6Listening = (startListening: AppStartListening) => {
    mailEventLoopV6Listener(startListening);
};
