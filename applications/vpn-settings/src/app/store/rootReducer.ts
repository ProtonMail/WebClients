import { combineReducers } from 'redux';

import {
    allowAddressDeletionReducer,
    domainsAddressesReducer,
    memberAuthDevicesReducer,
    passwordPoliciesReducer,
    paymentMethodsReducer,
    retentionPoliciesReducer,
    samlReducer,
} from '@proton/account';
import { calendarsReducer } from '@proton/calendar';
import { sharedReducers } from '@proton/redux-shared-store';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...passwordPoliciesReducer,
    ...paymentMethodsReducer,
    ...domainsAddressesReducer,
    ...calendarsReducer,
    ...samlReducer,
    ...allowAddressDeletionReducer,
    ...memberAuthDevicesReducer,
    ...retentionPoliciesReducer,
});
