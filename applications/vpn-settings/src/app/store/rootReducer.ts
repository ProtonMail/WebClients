import { combineReducers } from 'redux';

import { allowAddressDeletionReducer } from '@proton/account/allowAddressDeletion';
import { domainsAddressesReducer } from '@proton/account/domainsAddresses';
import { mspSubsidiariesReducer } from '@proton/account/mspSubsidiaries';
import { passwordPoliciesReducer } from '@proton/account/passwordPolicies';
import { paymentMethodsReducer } from '@proton/account/paymentMethods';
import { samlReducer } from '@proton/account/samlSSO';
import { staticExperimentsReducer } from '@proton/account/staticExperiments/slice';
import { authDevicesReducer } from '@proton/account/sso/authDevices';
import { memberAuthDevicesReducer } from '@proton/account/sso/memberAuthDevices';
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
    ...mspSubsidiariesReducer,
    ...staticExperimentsReducer,
});
