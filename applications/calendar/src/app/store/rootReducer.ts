import { combineReducers } from '@reduxjs/toolkit';

import { oauthTokenReducer } from '@proton/activation/src/logic/oauthToken';
import { calendarSettingsReducer } from '@proton/calendar/calendarUserSettings';
import { calendarsBootstrapReducer } from '@proton/calendar/calendarBootstrap';
import { calendarsReducer } from '@proton/calendar/calendars';
import { holidaysDirectoryReducer } from '@proton/calendar/holidaysDirectory';
import { breachesCountReducer } from '@proton/components';
import { sharedReducers } from '@proton/redux-shared-store';

import { busySlotsReducer } from './busySlots/busySlotsSlice';
import { eventsReducer } from './events/eventsSlice';
import { internalBookingReducer } from './internalBooking/interalBookingSlice';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...calendarsReducer,
    ...calendarsBootstrapReducer,
    ...calendarSettingsReducer,
    ...holidaysDirectoryReducer,
    ...busySlotsReducer,
    ...breachesCountReducer,
    ...eventsReducer,
    ...oauthTokenReducer,
    ...internalBookingReducer,
});

export type CalendarState = ReturnType<typeof rootReducer>;
