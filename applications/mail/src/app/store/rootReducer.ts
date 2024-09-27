import { combineReducers } from '@reduxjs/toolkit';

import { protonDomainsReducer } from '@proton/account';
import { calendarSettingsReducer, calendarsReducer, holidaysDirectoryReducer } from '@proton/calendar';
import { breachesCountReducer, securityCenterReducer } from '@proton/components';
import { conversationCountsReducer, filtersReducer, messageCountsReducer } from '@proton/mail';
import { sharedPersistReducer, sharedReducers } from '@proton/redux-shared-store';
import { selectPersistModel } from '@proton/redux-utilities';

import { attachmentsReducer } from './attachments/attachmentsSlice';
import { composersReducer } from './composers/composersSlice';
import { contactsReducer } from './contacts/contactsSlice';
import { conversationsReducer } from './conversations/conversationsSlice';
import { elementsReducer } from './elements/elementsSlice';
import { incomingDefaultsReducer } from './incomingDefaults/incomingDefaultsSlice';
import { layoutReducer } from './layout/layoutSlice';
import { messagesReducer } from './messages/messagesSlice';
import { snoozeReducer } from './snooze/snoozeSlice';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...filtersReducer,
    ...messageCountsReducer,
    ...conversationCountsReducer,
    ...calendarsReducer,
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
});

export type MailState = ReturnType<typeof rootReducer>;

export const persistReducer: Partial<{ [key in keyof MailState]: any }> = {
    ...sharedPersistReducer,
    filters: selectPersistModel,
    calendarUserSettings: selectPersistModel,
    calendars: selectPersistModel,
    holidaysDirectory: selectPersistModel,
};
