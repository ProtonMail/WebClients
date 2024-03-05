import { combineReducers } from '@reduxjs/toolkit';

import { calendarSettingsReducer, calendarsReducer, holidaysDirectoryReducer } from '@proton/calendar';
import { sharedReducers } from '@proton/redux-shared-store';

import { busyTimeSlotsReducer } from './busyTimeSlots/busyTimeSlotsSlice';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...calendarsReducer,
    ...calendarSettingsReducer,
    ...holidaysDirectoryReducer,
    ...busyTimeSlotsReducer,
});
