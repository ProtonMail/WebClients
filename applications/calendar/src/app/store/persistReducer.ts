import { sharedPersistReducer } from '@proton/redux-shared-store/sharedReducers';
import { getPersistedState } from '@proton/redux-shared-store/persist';
import { selectPersistModel } from '@proton/redux-utilities/creator';

import type { CalendarState } from './rootReducer';

const persistReducer: Partial<{ [key in keyof CalendarState]: any }> = {
    ...sharedPersistReducer,
    calendarUserSettings: selectPersistModel,
    calendars: selectPersistModel,
    holidaysDirectory: selectPersistModel,
    sessions: selectPersistModel,
    internalBookings: selectPersistModel,
};

export const getCalendarPersistedState = (state: CalendarState) => getPersistedState(state, persistReducer);
