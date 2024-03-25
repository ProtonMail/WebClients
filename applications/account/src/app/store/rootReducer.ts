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
import { sharedReducers } from '@proton/redux-shared-store';

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
