import { combineReducers } from '@reduxjs/toolkit';

import { calendarSettingsReducer, calendarsReducer, holidayCalendarsReducer } from '@proton/calendar';
import { sharedReducers } from '@proton/redux-shared-store';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...calendarsReducer,
    ...calendarSettingsReducer,
    ...holidayCalendarsReducer,
});
