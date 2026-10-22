import { PLANS } from '../core/constants';
import { EntitlementName } from '../core/entitlements/entitlement-names';
import { type Entitlement, EntitlementScope, EntitlementType } from '../core/entitlements/interface';
import { createEntitlementResolverForOrgAndUser } from '../core/entitlements/resolver';
import { buildEntitlementCatalog } from './buildEntitlementCatalog';
import { buildSubscription } from './buildSubscription';
import { makeEntitlements } from './makeEntitlements';

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
        EntitlementName.MultiUser,
        EntitlementName.CustomDomainAddresses,
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
    organizationPlans = subscriptionPlans,
}: {
    subscriptionPlans: CataloguedPlan[];
    organizationPlans?: CataloguedPlan[];
}) => {
    const grantedNames = [...new Set(organizationPlans.flatMap((plan) => prodCatalogGrants[plan]))];

    return createEntitlementResolverForOrgAndUser(
        buildEntitlementCatalog(prodCatalogGrants),
        makeEntitlements(grantedNames.map(toOrganizationEntitlement)),
        subscriptionPlans.map((plan) => buildSubscription(plan))
    );
};
