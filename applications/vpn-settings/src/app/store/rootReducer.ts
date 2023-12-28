import { combineReducers } from 'redux';

import {
    domainsAddressesReducer,
    domainsReducer,
    inactiveKeysReducer,
    membersReducer,
    paymentMethodsReducer,
    plansReducer,
} from '@proton/account';
import { calendarsReducer } from '@proton/calendar';
import { sharedReducers } from '@proton/redux-shared-store';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...paymentMethodsReducer,
    ...plansReducer,
    ...membersReducer,
    ...domainsReducer,
    ...domainsAddressesReducer,
    ...calendarsReducer,
    inactiveKeys: inactiveKeysReducer,
});
