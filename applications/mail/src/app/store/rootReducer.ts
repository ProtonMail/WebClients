import { combineReducers } from '@reduxjs/toolkit';

import { calendarSettingsReducer, calendarsReducer, holidaysDirectoryReducer } from '@proton/calendar';
import { securityCenterReducer } from '@proton/components/components/drawer/views/SecurityCenter/AccountSecurity/slice/accountSecuritySlice';
import { breachesCountReducer } from '@proton/components/components/drawer/views/SecurityCenter/BreachAlerts/slice/breachNotificationsSlice';
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
});

export type MailState = ReturnType<typeof rootReducer>;

export const persistReducer: Partial<{ [key in keyof MailState]: any }> = {
    ...sharedPersistReducer,
    filters: selectPersistModel,
    calendarUserSettings: selectPersistModel,
    calendars: selectPersistModel,
    holidaysDirectory: selectPersistModel,
};
