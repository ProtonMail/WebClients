import { combineReducers } from '@reduxjs/toolkit';

import {
    allowAddressDeletionReducer,
    authDevicesReducer,
    domainsAddressesReducer,
    memberAuthDevicesReducer,
    paymentMethodsReducer,
    samlReducer,
} from '@proton/account';
import { oauthTokenReducer } from '@proton/activation/src/logic/oauthToken';
import {
    calendarSettingsReducer,
    calendarsBootstrapReducer,
    calendarsReducer,
    holidaysDirectoryReducer,
} from '@proton/calendar';
import { filtersReducer, incomingAddressForwardingsReducer, outgoingAddressForwardingsReducer } from '@proton/mail';
import { sharedReducers } from '@proton/redux-shared-store';

export const rootReducer = combineReducers({
    ...sharedReducers,
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
});

export type AccountState = ReturnType<typeof rootReducer>;
