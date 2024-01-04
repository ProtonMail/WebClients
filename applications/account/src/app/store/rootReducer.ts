import { combineReducers } from '@reduxjs/toolkit';

import {
    domainsAddressesReducer,
    domainsReducer,
    inactiveKeysReducer,
    membersReducer,
    paymentMethodsReducer,
    plansReducer,
    protonDomainsReducer,
} from '@proton/account';
import { calendarSettingsReducer, calendarsReducer, holidaysDirectoryReducer } from '@proton/calendar';
import { filtersReducer, incomingAddressForwardingsReducer, outgoingAddressForwardingsReducer } from '@proton/mail';
import { sharedReducers } from '@proton/redux-shared-store';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...paymentMethodsReducer,
    ...plansReducer,
    ...domainsReducer,
    ...membersReducer,
    ...protonDomainsReducer,
    ...filtersReducer,
    ...incomingAddressForwardingsReducer,
    ...outgoingAddressForwardingsReducer,
    ...domainsAddressesReducer,
    ...calendarSettingsReducer,
    ...calendarsReducer,
    ...holidaysDirectoryReducer,
    inactiveKeys: inactiveKeysReducer,
});
