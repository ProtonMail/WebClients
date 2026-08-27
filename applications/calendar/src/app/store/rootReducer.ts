import { combineReducers } from '@reduxjs/toolkit';

import { breachesCountReducer } from '@proton/account';
import { oauthTokenReducer } from '@proton/activation/src/logic/oauthToken';
import { internalBookingReducer } from '@proton/calendar/bookings/store';
import { calendarsBootstrapReducer } from '@proton/calendar/calendarBootstrap';
import { calendarSettingsReducer } from '@proton/calendar/calendarUserSettings';
import { calendarsReducer } from '@proton/calendar/calendars';
import { holidaysDirectoryReducer } from '@proton/calendar/holidaysDirectory';
import { sharedReducers } from '@proton/redux-shared-store/sharedReducers';

import { busySlotsReducer } from './busySlots/busySlotsSlice';
import { eventsReducer } from './events/eventsSlice';

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
