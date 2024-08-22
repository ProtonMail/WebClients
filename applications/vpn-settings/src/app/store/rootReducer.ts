import { combineReducers } from 'redux';

import {
    allowAddressDeletionReducer,
    domainsAddressesReducer,
    paymentMethodsReducer,
    samlReducer,
} from '@proton/account';
import { calendarsReducer } from '@proton/calendar';
import { sharedReducers } from '@proton/redux-shared-store';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...paymentMethodsReducer,
    ...domainsAddressesReducer,
    ...calendarsReducer,
    ...samlReducer,
    ...allowAddressDeletionReducer,
});
