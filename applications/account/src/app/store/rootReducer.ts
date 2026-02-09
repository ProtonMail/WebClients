import { combineReducers } from '@reduxjs/toolkit';

import {
    allowAddressDeletionReducer,
    appNameReducer,
    authDevicesReducer,
    delegatedAccessReducer,
    domainsAddressesReducer,
    memberAuthDevicesReducer,
    passwordPoliciesReducer,
    paymentMethodsReducer,
    retentionPoliciesReducer,
    samlReducer,
} from '@proton/account';
import { oauthTokenReducer } from '@proton/activation/src/logic/oauthToken';
import { calendarSettingsReducer } from '@proton/calendar/calendarUserSettings';
import { calendarsBootstrapReducer } from '@proton/calendar/calendarBootstrap';
import { calendarsReducer } from '@proton/calendar/calendars';
import { holidaysDirectoryReducer } from '@proton/calendar/holidaysDirectory';
import { filtersReducer, incomingAddressForwardingsReducer, outgoingAddressForwardingsReducer } from '@proton/mail';
import { sharedReducers } from '@proton/redux-shared-store';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...passwordPoliciesReducer,
    ...paymentMethodsReducer,
    ...filtersReducer,
    ...incomingAddressForwardingsReducer,
    ...outgoingAddressForwardingsReducer,
    ...domainsAddressesReducer,
    ...calendarSettingsReducer,
    ...calendarsReducer,
    ...calendarsBootstrapReducer,
    ...holidaysDirectoryReducer,
    ...samlReducer,
    ...allowAddressDeletionReducer,
    ...authDevicesReducer,
    ...memberAuthDevicesReducer,
    ...oauthTokenReducer,
    ...retentionPoliciesReducer,
    ...delegatedAccessReducer,
    ...appNameReducer,
});

export type AccountState = ReturnType<typeof rootReducer>;
