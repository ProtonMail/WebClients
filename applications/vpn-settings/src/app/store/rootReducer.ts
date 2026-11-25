import { combineReducers } from 'redux';

import { membersWithoutRecoveryReducer } from '@proton/account-recovery/organization/membersWithoutRecovery';
import { authDevicesReducer } from '@proton/account-security/sso/authDevices';
import { memberAuthDevicesReducer } from '@proton/account-security/sso/memberAuthDevices';
import { allowAddressDeletionReducer } from '@proton/account/allowAddressDeletion';
import { domainsAddressesReducer } from '@proton/account/domainsAddresses';
import { membersPageReducer } from '@proton/account/members/membersPage';
import { mspSubsidiariesReducer } from '@proton/account/mspSubsidiaries';
import { passwordPoliciesReducer } from '@proton/account/passwordPolicies';
import { samlReducer } from '@proton/account/samlSSO';
import { staticExperimentsReducer } from '@proton/account/staticExperiments/slice';
import { oauthTokenReducer } from '@proton/activation/src/logic/oauthToken';
import { calendarsReducer } from '@proton/calendar/calendars';
import { offersDeliveryReducer } from '@proton/offers-delivery/store/slice';
import { sharedReducers } from '@proton/redux-shared-store/sharedReducers';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...passwordPoliciesReducer,
    ...membersWithoutRecoveryReducer,
    ...membersPageReducer,
    ...domainsAddressesReducer,
    ...calendarsReducer,
    ...samlReducer,
    ...allowAddressDeletionReducer,
    ...offersDeliveryReducer,
    ...authDevicesReducer,
    ...memberAuthDevicesReducer,
    ...oauthTokenReducer,
    ...mspSubsidiariesReducer,
    ...staticExperimentsReducer,
});
