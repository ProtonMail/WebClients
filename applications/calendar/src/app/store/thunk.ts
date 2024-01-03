import type { CalendarModelEventManager } from '@proton/calendar';
import type { ProtonThunkArguments } from '@proton/redux-shared-store';

export interface CalendarThunkArguments extends ProtonThunkArguments {
    calendarModelEventManager: CalendarModelEventManager;
}

export const extraThunkArguments = {} as CalendarThunkArguments;
