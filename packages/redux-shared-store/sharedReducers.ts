import {
    addressKeysReducer,
    addressesReducer,
    membersReducer,
    organizationKeyReducer,
    organizationReducer,
    organizationThemeSlice,
    scheduleCallReducer,
    subscriptionReducer,
    userInvitationsReducer,
    userKeysReducer,
    userReducer,
    userSettingsReducer,
    vpnServersCountReducer,
    welcomeFlagsReducer,
} from '@proton/account';
import { featuresReducer } from '@proton/features';
import {
    categoriesReducer,
    contactEmailsReducer,
    contactsReducer,
    importerConfigReducer,
    mailSettingsReducer,
} from '@proton/mail';
import { selectPersistModel } from '@proton/redux-utilities';

export const sharedReducers = {
    ...userReducer,
    ...userKeysReducer,
    ...addressesReducer,
    ...addressKeysReducer,
    ...userSettingsReducer,
    ...mailSettingsReducer,
    ...subscriptionReducer,
    ...organizationReducer,
    ...organizationKeyReducer,
    organizationTheme: organizationThemeSlice.reducer,
    ...userInvitationsReducer,
    ...contactsReducer,
    ...contactEmailsReducer,
    ...categoriesReducer,
    ...importerConfigReducer,
    ...vpnServersCountReducer,
    ...welcomeFlagsReducer,
    ...membersReducer,
    ...scheduleCallReducer,
    features: featuresReducer.reducer,
};

export const sharedPersistReducer: Partial<{ [key in keyof typeof sharedReducers]: any }> = {
    user: selectPersistModel,
    addresses: selectPersistModel,
    userSettings: selectPersistModel,
    mailSettings: selectPersistModel,
    subscription: selectPersistModel,
    contacts: selectPersistModel,
    contactEmails: selectPersistModel,
    categories: selectPersistModel,
    organization: selectPersistModel,
    userInvitations: selectPersistModel,
    vpnServersCount: selectPersistModel,
    features: (state: any) => state,
};
