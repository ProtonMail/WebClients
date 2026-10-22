import { accountSessionsSlice } from '@proton/account/accountSessions/slice';
import { addressKeysReducer } from '@proton/account/addressKeys';
import { addressesReducer } from '@proton/account/addresses';
import { apiStatusReducer } from '@proton/account/apiStatus';
import type { AvailableAppsState } from '@proton/account/availableApps';
import { availableAppsReducer } from '@proton/account/availableApps';
import { contactEmailsReducer } from '@proton/account/contactEmails';
import { delegatedAccessReducer } from '@proton/account/delegatedAccess';
import { domainsReducer } from '@proton/account/domains';
import { entitlementCatalogReducer } from '@proton/account/entitlementCatalog';
import { entitlementsReducer } from '@proton/account/entitlements';
import { featureTourReducer } from '@proton/account/featuresTour';
import { groupMembersReducer } from '@proton/account/groupMembers';
import { groupMembershipsReducer } from '@proton/account/groupMemberships';
import { groupOwnerInvitesReducer } from '@proton/account/groupOwnerInvites';
import { groupsReducer } from '@proton/account/groups';
import { inactiveKeysReducer } from '@proton/account/inactiveKeys';
import { ktSlice } from '@proton/account/kt';
import { memberReducer } from '@proton/account/member';
import { membersReducer } from '@proton/account/members';
import { organizationReducer } from '@proton/account/organization';
import { organizationThemeSlice } from '@proton/account/organization/theme/slice';
import { organizationKeyReducer } from '@proton/account/organizationKey';
import { organizationRolesReducer } from '@proton/account/organizationRoles';
import { passwordReminderReducer } from '@proton/account/passwordReminder';
import { paymentMethodsReducer } from '@proton/account/paymentMethods';
import { paymentStatusReducer } from '@proton/account/paymentStatus';
import { paymentsInitReducer } from '@proton/account/paymentsInit';
import { plansReducer } from '@proton/account/plans';
import { previousSubscriptionReducer } from '@proton/account/previousSubscription';
import { protonDomainsReducer } from '@proton/account/protonDomains';
import { sessionRecoverySlice } from '@proton/account/recovery/sessionRecovery';
import { referralInfoReducer } from '@proton/account/referralInfo';
import { referralsReducer } from '@proton/account/referrals';
import { scheduleCallReducer } from '@proton/account/scheduleCall';
import { subscriptionReducer } from '@proton/account/subscription';
import { userReducer } from '@proton/account/user';
import { userInvitationsReducer } from '@proton/account/userInvitations';
import { userKeysReducer } from '@proton/account/userKeys';
import { userPermissionsReducer } from '@proton/account/userPermissions';
import { userSettingsReducer } from '@proton/account/userSettings';
import { welcomeFlagsReducer } from '@proton/account/welcomeFlags';
import { featuresReducer } from '@proton/features/reducer';
import { contactsReducer } from '@proton/mail/store/contacts';
import { contactReducer } from '@proton/mail/store/contacts/contactSlice';
import { importerConfigReducer } from '@proton/mail/store/importerConfig';
import { categoriesReducer } from '@proton/mail/store/labels';
import { mailSettingsReducer } from '@proton/mail/store/mailSettings';
import { selectPersistModel } from '@proton/redux-utilities/creator';

export const sharedReducers = {
    ...apiStatusReducer,
    ...userReducer,
    ...userKeysReducer,
    ...plansReducer,
    ...addressesReducer,
    ...addressKeysReducer,
    inactiveKeys: inactiveKeysReducer,
    ...userSettingsReducer,
    ...mailSettingsReducer,
    ...subscriptionReducer,
    ...previousSubscriptionReducer,
    ...paymentMethodsReducer,
    ...paymentStatusReducer,
    ...paymentsInitReducer,
    ...organizationReducer,
    ...organizationKeyReducer,
    ...organizationRolesReducer,
    ...protonDomainsReducer,
    ...domainsReducer,
    ...entitlementCatalogReducer,
    ...entitlementsReducer,
    organizationTheme: organizationThemeSlice.reducer,
    ...userInvitationsReducer,
    ...contactReducer,
    ...contactsReducer,
    ...contactEmailsReducer,
    ...categoriesReducer,
    ...importerConfigReducer,
    ...welcomeFlagsReducer,
    ...memberReducer,
    ...membersReducer,
    ...scheduleCallReducer,
    ...groupsReducer,
    ...groupMembersReducer,
    ...groupMembershipsReducer,
    ...groupOwnerInvitesReducer,
    ...featureTourReducer,
    ...referralInfoReducer,
    ...referralsReducer,
    ...userPermissionsReducer,
    ...availableAppsReducer,
    kt: ktSlice.reducer,
    features: featuresReducer.reducer,
    sessions: accountSessionsSlice.reducer,
    sessionRecovery: sessionRecoverySlice.reducer,
    ...delegatedAccessReducer,
    ...passwordReminderReducer,
};

export const sharedPersistReducer: Partial<{ [key in keyof typeof sharedReducers]: any }> = {
    user: selectPersistModel,
    addresses: selectPersistModel,
    userSettings: selectPersistModel,
    mailSettings: selectPersistModel,
    subscription: selectPersistModel,
    contacts: selectPersistModel,
    contactEmails: selectPersistModel,
    plans: selectPersistModel,
    entitlementCatalog: selectPersistModel,
    categories: selectPersistModel,
    organization: selectPersistModel,
    userInvitations: selectPersistModel,
    protonDomains: selectPersistModel,
    domains: selectPersistModel,
    previousSubscription: selectPersistModel,
    referralInfo: selectPersistModel,
    availableApps: (state: AvailableAppsState['availableApps']) => state,
    features: (state: any) => state,
};
