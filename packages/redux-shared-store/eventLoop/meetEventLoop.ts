import type { TypedStartListening } from '@reduxjs/toolkit';

import type { MeetEventLoopRequiredState } from '@proton/meet/store/meetEventLoop/interface';
import { meetEventLoopListener } from '@proton/meet/store/meetEventLoop/listener';
import type { ProtonDispatch, ProtonThunkArguments } from '@proton/redux-shared-store-types';

type AppStartListening = TypedStartListening<MeetEventLoopRequiredState, ProtonDispatch<any>, ProtonThunkArguments>;

export const startMeetEventLoopListening = (startListening: AppStartListening) => {
    meetEventLoopListener(startListening);
};
