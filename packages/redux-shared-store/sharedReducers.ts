import {
    addressKeysReducer,
    addressesReducer,
    membersReducer,
    organizationKeyReducer,
    organizationReducer,
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
    ...userInvitationsReducer,
    ...contactsReducer,
    ...contactEmailsReducer,
    ...categoriesReducer,
    ...importerConfigReducer,
    ...vpnServersCountReducer,
    ...welcomeFlagsReducer,
    ...membersReducer,
    features: featuresReducer.reducer,
};
