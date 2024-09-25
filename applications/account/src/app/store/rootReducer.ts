import { combineReducers } from '@reduxjs/toolkit';

import {
    allowAddressDeletionReducer,
    domainsAddressesReducer,
    paymentMethodsReducer,
    samlReducer,
} from '@proton/account';
import { calendarSettingsReducer, calendarsReducer, holidaysDirectoryReducer } from '@proton/calendar';
import { filtersReducer, incomingAddressForwardingsReducer, outgoingAddressForwardingsReducer } from '@proton/mail';
import { sharedPersistReducer, sharedReducers } from '@proton/redux-shared-store';
import { selectPersistModel } from '@proton/redux-utilities';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...paymentMethodsReducer,
    ...filtersReducer,
    ...incomingAddressForwardingsReducer,
    ...outgoingAddressForwardingsReducer,
    ...domainsAddressesReducer,
    ...calendarSettingsReducer,
    ...calendarsReducer,
    ...holidaysDirectoryReducer,
    ...samlReducer,
    ...allowAddressDeletionReducer,
});

export type AccountState = ReturnType<typeof rootReducer>;

export const persistReducer: Partial<{ [key in keyof AccountState]: any }> = {
    ...sharedPersistReducer,
    paymentMethods: selectPersistModel,
    members: selectPersistModel,
    filters: selectPersistModel,
    incomingAddressForwarding: selectPersistModel,
    outgoingAddressForwarding: selectPersistModel,
    calendarUserSettings: selectPersistModel,
    holidaysDirectory: selectPersistModel,
    sso: selectPersistModel,
};
