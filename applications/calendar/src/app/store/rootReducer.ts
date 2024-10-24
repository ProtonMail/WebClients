import { combineReducers } from '@reduxjs/toolkit';

import {
    calendarSettingsReducer,
    calendarsBootstrapReducer,
    calendarsReducer,
    holidaysDirectoryReducer,
} from '@proton/calendar';
import { breachesCountReducer } from '@proton/components';
import { sharedReducers } from '@proton/redux-shared-store';

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
});
