import type { TypedStartListening } from '@reduxjs/toolkit';

import { calendarEventLoopV6Listener } from '@proton/calendar/calendarEventLoopV6Listener';
import type { CalendarEventLoopV6RequiredState } from '@proton/calendar/types/CalendarEventLoopV6RequiredState';
import type { ProtonDispatch, ProtonThunkArguments } from '@proton/redux-shared-store-types';

type AppStartListening = TypedStartListening<
    CalendarEventLoopV6RequiredState,
    ProtonDispatch<any>,
    ProtonThunkArguments
>;

export const startCalendarEventLoopV6Listening = (startListening: AppStartListening) => {
    calendarEventLoopV6Listener(startListening);
};
