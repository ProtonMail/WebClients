import { combineReducers } from 'redux';

import {
    allowAddressDeletionReducer,
    authDevicesReducer,
    domainsAddressesReducer,
    memberAuthDevicesReducer,
    passwordPoliciesReducer,
    paymentMethodsReducer,
    samlReducer,
} from '@proton/account';
import { oauthTokenReducer } from '@proton/activation/src/logic/oauthToken';
import { calendarsReducer } from '@proton/calendar/calendars';
import { sharedReducers } from '@proton/redux-shared-store/sharedReducers';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...passwordPoliciesReducer,
    ...paymentMethodsReducer,
    ...domainsAddressesReducer,
    ...calendarsReducer,
    ...samlReducer,
    ...allowAddressDeletionReducer,
    ...authDevicesReducer,
    ...memberAuthDevicesReducer,
    ...oauthTokenReducer,
});
