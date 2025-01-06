import { sharedPersistReducer } from '@proton/redux-shared-store';
import { getPersistedState } from '@proton/redux-shared-store/persist';
import { selectPersistModel } from '@proton/redux-utilities';

import type { AccountState } from './rootReducer';

const persistReducer: Partial<{ [key in keyof AccountState]: any }> = {
    ...sharedPersistReducer,
    paymentMethods: selectPersistModel,
    members: selectPersistModel,
    filters: selectPersistModel,
    incomingAddressForwarding: selectPersistModel,
    outgoingAddressForwarding: selectPersistModel,
    calendarUserSettings: selectPersistModel,
    holidaysDirectory: selectPersistModel,
    sso: selectPersistModel,
    sessions: selectPersistModel,
};

export const getAccountPersistedState = (state: AccountState) => getPersistedState(state, persistReducer);
