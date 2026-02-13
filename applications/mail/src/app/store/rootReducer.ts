import { combineReducers } from '@reduxjs/toolkit';

import { protonDomainsReducer, retentionPoliciesReducer } from '@proton/account';
import { calendarSettingsReducer } from '@proton/calendar/calendarUserSettings';
import { calendarsBootstrapReducer } from '@proton/calendar/calendarBootstrap';
import { calendarsReducer } from '@proton/calendar/calendars';
import { holidaysDirectoryReducer } from '@proton/calendar/holidaysDirectory';
import { breachesCountReducer, securityCenterReducer } from '@proton/components';
import { conversationCountsReducer } from '@proton/mail/store/counts/conversationCountsSlice';
import { filtersReducer } from '@proton/mail/store/filters';
import { messageCountsReducer } from '@proton/mail/store/counts/messageCountsSlice';
import { sharedReducers } from '@proton/redux-shared-store';

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
    ...filtersReducer,
    ...messageCountsReducer,
    ...conversationCountsReducer,
    ...calendarsReducer,
    ...calendarsBootstrapReducer,
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
