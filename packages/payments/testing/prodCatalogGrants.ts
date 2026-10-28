import { PLANS } from '../core/constants';
import { EntitlementName } from '../core/entitlements/entitlement-names';
import { type Entitlement, EntitlementScope, EntitlementType } from '../core/entitlements/interface';
import { createEntitlementResolverForOrgAndUser } from '../core/entitlements/resolver';
import {
    type UserAndOrganizationForSubscriptions,
    getUnreadableSubscriptionsReason,
} from '../core/entitlements/unreadable-subscriptions';
import { buildEntitlementCatalog } from './buildEntitlementCatalog';
import { buildSubscription } from './buildSubscription';
import { makeEntitlements } from './makeEntitlements';
import { regularAdmin } from './regularAdmin';

export const prodCatalogGrants = {
    [PLANS.MAIL]: [EntitlementName.FlagsInbox, EntitlementName.CustomDomainAddresses],
    [PLANS.FAMILY]: [
        EntitlementName.FlagsInbox,
        EntitlementName.FlagsVpn,
        EntitlementName.MultiUser,
        EntitlementName.CustomDomainAddresses,
    ],
    [PLANS.MAIL_PRO]: [
        EntitlementName.FlagsInbox,
        EntitlementName.Business,
        EntitlementName.MultiUser,
        EntitlementName.CustomDomainAddresses,
    ],
    [PLANS.MEET_BUSINESS]: [
        EntitlementName.FlagsMeet,
        EntitlementName.Business,
        EntitlementName.MultiUser,
        EntitlementName.ExternalManagedMembers,
        EntitlementName.CustomDomainAddresses,
    ],
    [PLANS.BUNDLE_PRO_2024]: [
        EntitlementName.FlagsInbox,
        EntitlementName.FlagsVpn,
        EntitlementName.Business,
        EntitlementName.Groups,
        EntitlementName.MultiUser,
        EntitlementName.CustomDomainAddresses,
        EntitlementName.CustomOrganizationLogo,
    ],
    [PLANS.BUNDLE_BIZ_2025]: [
        EntitlementName.FlagsInbox,
        EntitlementName.FlagsVpn,
        EntitlementName.FlagsPass,
        EntitlementName.FlagsMeet,
        EntitlementName.Business,
        EntitlementName.OrganizationPolicy,
        EntitlementName.ActivityMonitorPass,
        EntitlementName.Groups,
        EntitlementName.MultiUser,
        EntitlementName.CustomDomainAddresses,
        EntitlementName.CustomOrganizationLogo,
    ],
    [PLANS.VISIONARY]: [
        EntitlementName.FlagsInbox,
        EntitlementName.FlagsVpn,
        EntitlementName.FlagsPass,
        EntitlementName.FlagsMeet,
        EntitlementName.Groups,
        EntitlementName.MultiUser,
        EntitlementName.CustomDomainAddresses,
        EntitlementName.CustomOrganizationLogo,
    ],
    [PLANS.DRIVE_BUSINESS]: [
        EntitlementName.Business,
        EntitlementName.OrganizationPolicy,
        EntitlementName.Groups,
        EntitlementName.MultiUser,
        EntitlementName.ExternalManagedMembers,
        EntitlementName.CustomOrganizationLogo,
    ],
    [PLANS.VPN_PRO]: [
        EntitlementName.FlagsVpn,
        EntitlementName.Business,
        EntitlementName.Groups,
        EntitlementName.MultiUser,
        EntitlementName.ExternalManagedMembers,
    ],
    [PLANS.PASS_PRO]: [EntitlementName.FlagsPass, EntitlementName.Business],
    [PLANS.PASS_BUSINESS]: [
        EntitlementName.FlagsPass,
        EntitlementName.Business,
        EntitlementName.OrganizationPolicy,
        EntitlementName.ActivityMonitorPass,
        EntitlementName.Groups,
        EntitlementName.MultiUser,
        EntitlementName.ExternalManagedMembers,
        EntitlementName.Sso,
        EntitlementName.CustomOrganizationLogo,
    ],
    [PLANS.VPN_BUSINESS]: [
        EntitlementName.FlagsVpn,
        EntitlementName.Business,
        EntitlementName.MaxDedicatedIps,
        EntitlementName.OrganizationPolicy,
        EntitlementName.Groups,
        EntitlementName.MultiUser,
        EntitlementName.ExternalManagedMembers,
        EntitlementName.Sso,
        EntitlementName.CustomOrganizationLogo,
    ],
    [PLANS.LUMO_BUSINESS]: [
        EntitlementName.FlagsLumo,
        EntitlementName.Business,
        EntitlementName.OrganizationPolicy,
        EntitlementName.Groups,
        EntitlementName.MultiUser,
        EntitlementName.ExternalManagedMembers,
        EntitlementName.Sso,
        EntitlementName.CustomOrganizationLogo,
    ],
} satisfies Partial<Record<PLANS, EntitlementName[]>>;

export type CataloguedPlan = keyof typeof prodCatalogGrants;

export const toOrganizationEntitlement = (name: EntitlementName): Entitlement => ({
    Name: name,
    Type: EntitlementType.Switch,
    Quantity: 1,
    Scope: EntitlementScope.Organization,
});

export const buildOrgAndUserEntitlementChecks = ({
    subscriptionPlans,
    user = regularAdmin.user,
    organization = regularAdmin.organization,
}: {
    subscriptionPlans: CataloguedPlan[];
} & Partial<UserAndOrganizationForSubscriptions>) => {
    const grantedNames = [...new Set(subscriptionPlans.flatMap((plan) => prodCatalogGrants[plan]))];
    const canReadSubscriptions = getUnreadableSubscriptionsReason({ user, organization }) === undefined;

    return createEntitlementResolverForOrgAndUser({
        entitlementCatalog: buildEntitlementCatalog(prodCatalogGrants),
        entitlements: makeEntitlements(grantedNames.map(toOrganizationEntitlement)),
        subscriptions: canReadSubscriptions ? subscriptionPlans.map((plan) => buildSubscription(plan)) : [],
        user,
        organization,
    });
};
