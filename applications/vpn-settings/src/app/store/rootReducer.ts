import { combineReducers } from 'redux';

import {
    domainsAddressesReducer,
    domainsReducer,
    inactiveKeysReducer,
    membersReducer,
    paymentMethodsReducer,
    plansReducer,
} from '@proton/account';
import { sharedReducers } from '@proton/redux-shared-store';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...paymentMethodsReducer,
    ...plansReducer,
    ...membersReducer,
    ...domainsReducer,
    ...domainsAddressesReducer,
    inactiveKeys: inactiveKeysReducer,
});
