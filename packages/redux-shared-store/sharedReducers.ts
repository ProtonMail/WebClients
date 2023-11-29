import {
    addressKeysReducer,
    addressesReducer,
    organizationKeyReducer,
    organizationReducer,
    subscriptionReducer,
    userInvitationsReducer,
    userKeysReducer,
    userReducer,
    userSettingsReducer,
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
    ...addressesReducer,
    ...addressKeysReducer,
    ...userSettingsReducer,
    ...userKeysReducer,
    ...mailSettingsReducer,
    ...subscriptionReducer,
    ...organizationReducer,
    ...organizationKeyReducer,
    ...userInvitationsReducer,
    ...contactsReducer,
    ...contactEmailsReducer,
    ...categoriesReducer,
    ...importerConfigReducer,
    features: featuresReducer.reducer,
};
