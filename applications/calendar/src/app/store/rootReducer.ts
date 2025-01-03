import { combineReducers } from '@reduxjs/toolkit';

import { oauthTokenReducer } from '@proton/activation/src/logic/oauthToken';
import {
    calendarSettingsReducer,
    calendarsBootstrapReducer,
    calendarsReducer,
    holidaysDirectoryReducer,
} from '@proton/calendar';
import { breachesCountReducer } from '@proton/components';
import { sharedPersistReducer, sharedReducers } from '@proton/redux-shared-store';
import { selectPersistModel } from '@proton/redux-utilities';

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
});

export type CalendarState = ReturnType<typeof rootReducer>;

export const persistReducer: Partial<{ [key in keyof CalendarState]: any }> = {
    ...sharedPersistReducer,
    calendarUserSettings: selectPersistModel,
    calendars: selectPersistModel,
    holidaysDirectory: selectPersistModel,
    sessions: selectPersistModel,
};
