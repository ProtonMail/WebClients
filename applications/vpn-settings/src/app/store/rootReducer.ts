import { combineReducers } from 'redux';

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
import { calendarsReducer } from '@proton/calendar';
import { sharedReducers } from '@proton/redux-shared-store';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...paymentMethodsReducer,
    ...plansReducer,
    ...protonDomainsReducer,
    ...domainsReducer,
    ...domainsAddressesReducer,
    ...calendarsReducer,
    ...samlReducer,
    ...allowAddressDeletionReducer,
    inactiveKeys: inactiveKeysReducer,
});
