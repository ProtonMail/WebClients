import type { TypedStartListening } from '@reduxjs/toolkit';

import type { ProtonDispatch, ProtonThunkArguments } from '@proton/redux-shared-store';

import type { CalendarModelEventManager } from './calendarModelEventManager';

export interface CalendarThunkArguments extends ProtonThunkArguments {
    calendarModelEventManager: CalendarModelEventManager;
}

export type CalendarStartListening<RequiredState> = TypedStartListening<
    RequiredState,
    ProtonDispatch<any>,
    CalendarThunkArguments
>;
