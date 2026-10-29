import { PLANS } from '../core/constants';
import { EntitlementName } from '../core/entitlements/entitlement-names';
import { type Entitlement, EntitlementType } from '../core/entitlements/interface';
import { createEntitlementResolverForOrgAndUser } from '../core/entitlements/resolver';
import {
    type UserAndOrganizationForSubscriptions,
    getUnreadableSubscriptionsReason,
} from '../core/entitlements/unreadable-subscriptions';
import { type Grant, buildEntitlementCatalog, catalogEntry } from './buildEntitlementCatalog';
import { buildSubscription } from './buildSubscription';
import { makeEntitlements } from './makeEntitlements';
import { regularAdmin } from './regularAdmin';

const maxRevisionDays = (Quantity: number) =>
    catalogEntry(EntitlementName.MaxRevisionDays, { Type: EntitlementType.Value, Quantity });

export const prodCatalogGrants = {
    [PLANS.DRIVE]: [EntitlementName.FlagsDrive, maxRevisionDays(3650)],
    [PLANS.DRIVE_LITE]: [EntitlementName.FlagsDrive, maxRevisionDays(7)],
    [PLANS.BUNDLE]: [
        EntitlementName.FlagsInbox,
        EntitlementName.FlagsVpn,
        EntitlementName.FlagsPass,
        EntitlementName.FlagsDrive,
        EntitlementName.CustomDomainAddresses,
        maxRevisionDays(3650),
    ],
    [PLANS.MAIL]: [EntitlementName.FlagsInbox, EntitlementName.CustomDomainAddresses],
    [PLANS.DUO]: [
        EntitlementName.FlagsInbox,
        EntitlementName.FlagsDrive,
        EntitlementName.FlagsVpn,
        EntitlementName.FlagsPass,
        EntitlementName.MultiUser,
        EntitlementName.CustomDomainAddresses,
    ],
    [PLANS.FAMILY]: [
        EntitlementName.FlagsInbox,
        EntitlementName.FlagsDrive,
        EntitlementName.FlagsVpn,
        EntitlementName.FlagsPass,
        EntitlementName.MultiUser,
        EntitlementName.CustomDomainAddresses,
        maxRevisionDays(3650),
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
        EntitlementName.FlagsDrive,
        EntitlementName.FlagsVpn,
        EntitlementName.FlagsPass,
        EntitlementName.Business,
        EntitlementName.Groups,
        EntitlementName.MultiUser,
        EntitlementName.CustomDomainAddresses,
        EntitlementName.CustomOrganizationLogo,
        maxRevisionDays(3650),
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
        maxRevisionDays(3650),
    ],
    [PLANS.VISIONARY]: [
        EntitlementName.FlagsInbox,
        EntitlementName.FlagsDrive,
        EntitlementName.FlagsVpn,
        EntitlementName.FlagsPass,
        EntitlementName.FlagsMeet,
        EntitlementName.Groups,
        EntitlementName.MultiUser,
        EntitlementName.CustomDomainAddresses,
        EntitlementName.CustomOrganizationLogo,
        maxRevisionDays(3650),
    ],
    [PLANS.DRIVE_PRO]: [
        EntitlementName.FlagsDrive,
        EntitlementName.Business,
        EntitlementName.MultiUser,
        maxRevisionDays(3650),
    ],
    [PLANS.DRIVE_BUSINESS]: [
        EntitlementName.FlagsDrive,
        EntitlementName.Business,
        EntitlementName.OrganizationPolicy,
        EntitlementName.Groups,
        EntitlementName.MultiUser,
        EntitlementName.ExternalManagedMembers,
        EntitlementName.CustomOrganizationLogo,
        maxRevisionDays(365),
    ],
    [PLANS.VPN_PRO]: [
        EntitlementName.FlagsVpn,
        EntitlementName.Business,
        EntitlementName.Groups,
        EntitlementName.MultiUser,
        EntitlementName.ExternalManagedMembers,
    ],
    [PLANS.PASS]: [EntitlementName.FlagsPass],
    [PLANS.VPN2024]: [EntitlementName.FlagsVpn],
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
} satisfies Partial<Record<PLANS, Grant[]>>;

export type CataloguedPlan = keyof typeof prodCatalogGrants;

export const toOrganizationEntitlement = (grant: Grant): Entitlement => {
    const { Name, Type, Quantity, Scope } = typeof grant === 'string' ? catalogEntry(grant) : grant;
    return { Name, Type, Quantity, Scope } as Entitlement;
};

export const buildOrganizationEntitlements = (plans: CataloguedPlan[]): Entitlement[] => {
    const entitlementsByName = new Map<EntitlementName, Entitlement>();
    const grants = plans.flatMap((plan): Grant[] => prodCatalogGrants[plan]);

    for (const entitlement of grants.map(toOrganizationEntitlement)) {
        const granted = entitlementsByName.get(entitlement.Name);
        if (!granted || granted.Quantity < entitlement.Quantity) {
            entitlementsByName.set(entitlement.Name, entitlement);
        }
    }

    return [...entitlementsByName.values()];
};

export const buildOrgAndUserEntitlementChecks = ({
    subscriptionPlans,
    user = regularAdmin.user,
    organization = regularAdmin.organization,
}: {
    subscriptionPlans: CataloguedPlan[];
} & Partial<UserAndOrganizationForSubscriptions>) => {
    const canReadSubscriptions = getUnreadableSubscriptionsReason({ user, organization }) === undefined;

    return createEntitlementResolverForOrgAndUser({
        entitlementCatalog: buildEntitlementCatalog(prodCatalogGrants),
        entitlements: makeEntitlements(buildOrganizationEntitlements(subscriptionPlans)),
        subscriptions: canReadSubscriptions ? subscriptionPlans.map((plan) => buildSubscription(plan)) : [],
        user,
        organization,
    });
};
