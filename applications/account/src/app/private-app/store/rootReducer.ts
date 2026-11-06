import { combineReducers } from '@reduxjs/toolkit';

import { allowAddressDeletionReducer } from '@proton/account/allowAddressDeletion';
import { appNameReducer } from '@proton/account/appName';
import { domainsAddressesReducer } from '@proton/account/domainsAddresses';
import { mspSubsidiariesReducer } from '@proton/account/mspSubsidiaries';
import { passwordPoliciesReducer } from '@proton/account/passwordPolicies';
import { retentionPoliciesReducer } from '@proton/account/retentionPolicies';
import { safetyReviewTelemetryReducer } from '@proton/account/safetyReview/telemetry/safetyReviewTelemetrySlice';
import { samlReducer } from '@proton/account/samlSSO';
import { authDevicesReducer } from '@proton/account/sso/authDevices';
import { memberAuthDevicesReducer } from '@proton/account/sso/memberAuthDevices';
import { userOrganizationsReducer } from '@proton/account/userOrganizations';
import { oauthTokenReducer } from '@proton/activation/src/logic/oauthToken';
import { calendarsBootstrapReducer } from '@proton/calendar/calendarBootstrap';
import { calendarSettingsReducer } from '@proton/calendar/calendarUserSettings';
import { calendarsReducer } from '@proton/calendar/calendars';
import { holidaysDirectoryReducer } from '@proton/calendar/holidaysDirectory';
import { filtersReducer } from '@proton/mail/store/filters';
import { incomingAddressForwardingsReducer } from '@proton/mail/store/forwarding/incoming';
import { outgoingAddressForwardingsReducer } from '@proton/mail/store/forwarding/outgoing';
import { offersDeliveryReducer } from '@proton/offers-delivery/store/slice';
import { sharedReducers } from '@proton/redux-shared-store/sharedReducers';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...offersDeliveryReducer,
    ...passwordPoliciesReducer,
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
    ...mspSubsidiariesReducer,
    ...userOrganizationsReducer,
    ...appNameReducer,
    ...safetyReviewTelemetryReducer,
});

export type AccountState = ReturnType<typeof rootReducer>;
