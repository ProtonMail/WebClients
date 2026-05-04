import { sharedPersistReducer } from '@proton/redux-shared-store/sharedReducers';
import { getPersistedState } from '@proton/redux-shared-store/persist';
import { selectPersistModel } from '@proton/redux-utilities/creator';

import type { MailState } from './rootReducer';

const persistReducer: Partial<{ [key in keyof MailState]: any }> = {
    ...sharedPersistReducer,
    filters: selectPersistModel,
    calendarUserSettings: selectPersistModel,
    calendars: selectPersistModel,
    holidaysDirectory: selectPersistModel,
    sessions: selectPersistModel,
};

export const getMailPersistedState = (state: MailState) => getPersistedState(state, persistReducer);
