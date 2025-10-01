import { sharedPersistReducer } from '@proton/redux-shared-store';
import { getPersistedState } from '@proton/redux-shared-store/persist';
import { selectPersistModel } from '@proton/redux-utilities';

import type { DriveState } from './rootReducer';

const persistReducer: Partial<{ [key in keyof DriveState]: any }> = {
    ...sharedPersistReducer,
    sessions: selectPersistModel,
};

export const getDrivePersistedState = (state: DriveState) => getPersistedState(state, persistReducer);
