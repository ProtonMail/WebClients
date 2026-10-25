import { combineReducers } from '@reduxjs/toolkit';

import { securityCenterReducer } from '@proton/account/accountSecurity/accountSecuritySlice';
import { breachesCountReducer } from '@proton/account/breaches/breachNotificationsSlice';
import { protonDomainsReducer } from '@proton/account/protonDomains';
import { retentionPoliciesReducer } from '@proton/account/retentionPolicies';

import { internalBookingReducer } from '@proton/calendar/bookings/store';
import { calendarsBootstrapReducer } from '@proton/calendar/calendarBootstrap';
import { calendarSettingsReducer } from '@proton/calendar/calendarUserSettings';
import { calendarsReducer } from '@proton/calendar/calendars';
import { holidaysDirectoryReducer } from '@proton/calendar/holidaysDirectory';
import { conversationCountsReducer } from '@proton/mail/store/counts/conversationCountsSlice';
import { messageCountsReducer } from '@proton/mail/store/counts/messageCountsSlice';
import { filtersReducer } from '@proton/mail/store/filters';
import { offersDeliveryReducer } from '@proton/offers-delivery/store/slice';
import { sharedReducers } from '@proton/redux-shared-store/sharedReducers';

import { attachmentsReducer } from './attachments/attachmentsSlice';
import { composersReducer } from './composers/composersSlice';
import { contactsReducer } from './contacts/contactsSlice';
import { conversationsReducer } from './conversations/conversationsSlice';
import { elementsReducer } from './elements/elementsSlice';
import { incomingDefaultsReducer } from './incomingDefaults/incomingDefaultsSlice';
import { layoutReducer } from './layout/layoutSlice';
import { messagesReducer } from './messages/messagesSlice';
import { newsletterSubscriptionsReducer } from './newsletterSubscriptions/newsletterSubscriptionsSlice';
import { snoozeReducer } from './snooze/snoozeSlice';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...offersDeliveryReducer,
    ...filtersReducer,
    ...messageCountsReducer,
    ...conversationCountsReducer,
    ...calendarsReducer,
    ...calendarsBootstrapReducer,
    ...internalBookingReducer,
    ...calendarSettingsReducer,
    ...holidaysDirectoryReducer,
    ...attachmentsReducer,
    ...composersReducer,
    ...contactsReducer,
    ...conversationsReducer,
    ...elementsReducer,
    ...incomingDefaultsReducer,
    ...layoutReducer,
    ...messagesReducer,
    ...snoozeReducer,
    ...securityCenterReducer,
    ...breachesCountReducer,
    ...protonDomainsReducer,
    ...retentionPoliciesReducer,
    ...newsletterSubscriptionsReducer,
});

export type MailState = ReturnType<typeof rootReducer>;
