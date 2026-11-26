import { getPersistedState } from '@proton/redux-shared-store/persist';
import { sharedPersistReducer } from '@proton/redux-shared-store/sharedReducers';

import type { MeetState } from './rootReducer';

const persistReducer: Partial<{ [key in keyof MeetState]: any }> = {
    ...sharedPersistReducer,
};

export const getMeetPersistedState = (state: MeetState) => getPersistedState(state, persistReducer);
