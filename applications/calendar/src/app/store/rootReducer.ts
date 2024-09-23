import { combineReducers } from '@reduxjs/toolkit';

import { calendarSettingsReducer, calendarsReducer, holidaysDirectoryReducer } from '@proton/calendar';
import { breachesCountReducer } from '@proton/components';
import { sharedReducers } from '@proton/redux-shared-store';

import { busySlotsReducer } from './busySlots/busySlotsSlice';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...calendarsReducer,
    ...calendarSettingsReducer,
    ...holidaysDirectoryReducer,
    ...busySlotsReducer,
    ...breachesCountReducer,
});
