import { combineReducers } from '@reduxjs/toolkit';

import {
    allowAddressDeletionReducer,
    domainsAddressesReducer,
    domainsReducer,
    inactiveKeysReducer,
    paymentMethodsReducer,
    plansReducer,
    protonDomainsReducer,
    samlReducer,
} from '@proton/account';
import { calendarSettingsReducer, calendarsReducer, holidaysDirectoryReducer } from '@proton/calendar';
import { filtersReducer, incomingAddressForwardingsReducer, outgoingAddressForwardingsReducer } from '@proton/mail';
import { sharedPersistReducer, sharedReducers } from '@proton/redux-shared-store';
import { selectPersistModel } from '@proton/redux-utilities';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...paymentMethodsReducer,
    ...plansReducer,
    ...domainsReducer,
    ...protonDomainsReducer,
    ...filtersReducer,
    ...incomingAddressForwardingsReducer,
    ...outgoingAddressForwardingsReducer,
    ...domainsAddressesReducer,
    ...calendarSettingsReducer,
    ...calendarsReducer,
    ...holidaysDirectoryReducer,
    ...samlReducer,
    ...allowAddressDeletionReducer,
    inactiveKeys: inactiveKeysReducer,
});

export type AccountState = ReturnType<typeof rootReducer>;

export const persistReducer: Partial<{ [key in keyof AccountState]: any }> = {
    ...sharedPersistReducer,
    paymentMethods: selectPersistModel,
    plans: selectPersistModel,
    domains: selectPersistModel,
    members: selectPersistModel,
    protonDomains: selectPersistModel,
    filters: selectPersistModel,
    incomingAddressForwarding: selectPersistModel,
    outgoingAddressForwarding: selectPersistModel,
    calendarUserSettings: selectPersistModel,
    calendars: selectPersistModel,
    holidaysDirectory: selectPersistModel,
    sso: selectPersistModel,
};
