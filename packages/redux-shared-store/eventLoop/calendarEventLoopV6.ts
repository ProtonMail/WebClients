import type { TypedStartListening } from '@reduxjs/toolkit';

import { calendarEventLoopV6Listener } from '@proton/calendar/calendarEventLoop/listeners';
import type { CalendarEventLoopV6RequiredState } from '@proton/calendar/calendarEventLoop/interface';
import type { ProtonDispatch, ProtonThunkArguments } from '@proton/redux-shared-store-types';

type AppStartListening = TypedStartListening<
    CalendarEventLoopV6RequiredState,
    ProtonDispatch<any>,
    ProtonThunkArguments
>;

export const startCalendarEventLoopV6Listening = (startListening: AppStartListening) => {
    calendarEventLoopV6Listener(startListening);
};
