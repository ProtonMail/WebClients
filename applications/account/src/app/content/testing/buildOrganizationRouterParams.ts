import { buildUser } from '@proton/account/testing/buildUser';
import { getOrgPermissions } from '@proton/account/userPermissions';
import { PLANS } from '@proton/payments/core/constants';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { type Entitlement, EntitlementScope, EntitlementType } from '@proton/payments/core/entitlements/interface';
import { createEntitlementResolverForOrgAndUser } from '@proton/payments/core/entitlements/resolver';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { makeEntitlements } from '@proton/payments/testing/makeEntitlements';
import { APPS, ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import type { Group, GroupFlags } from '@proton/shared/lib/interfaces/Group';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import { PERMISSIONS } from '@proton/shared/lib/interfaces/UserPermission';

import type { Flags, OrganizationRouterParams } from '../router-params';

const prodCatalogGrants = {
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

type CataloguedPlan = keyof typeof prodCatalogGrants;

export const defaultFlags: Flags = {
    isAlwaysOnVpnEnabled: false,
    isReferralProgramEnabled: false,
    isDriveEasySwitchNewUIEnabled: false,
    showSignInRestrictionToggle: false,
    canDisplayNonPrivateEmailPhone: false,
    isScribeEnabled: false,
    isZoomIntegrationEnabled: false,
    isProtonMeetIntegrationEnabled: false,
    isCryptoPostQuantumOptInEnabled: false,
    isSsoForPbsEnabled: false,
    isRetentionPoliciesEnabled: false,
    isCategoryViewEnabled: false,
};

const toOrganizationEntitlement = (name: EntitlementName): Entitlement => ({
    Name: name,
    Type: EntitlementType.Switch,
    Quantity: 1,
    Scope: EntitlementScope.Organization,
});

const buildEntitlementsForPlan = (plan: CataloguedPlan | undefined, subscriptionPlan: CataloguedPlan | undefined) => {
    const grantedNames: EntitlementName[] = plan ? prodCatalogGrants[plan] : [];

    return createEntitlementResolverForOrgAndUser(
        buildEntitlementCatalog(prodCatalogGrants),
        makeEntitlements(grantedNames.map(toOrganizationEntitlement)),
        subscriptionPlan ? [buildSubscription(subscriptionPlan)] : []
    );
};

export const buildOrganizationWithKeys = (overrides: Partial<OrganizationExtended> = {}): OrganizationExtended =>
    ({
        Name: 'Example organization',
        RequiresKey: 1,
        HasKeys: 1,
        State: ORGANIZATION_STATE.ACTIVE,
        IsSubsidiary: false,
        UsedMembers: 2,
        MaxMembers: 10,
        ...overrides,
    }) as OrganizationExtended;

export const buildGroup = (flags: GroupFlags): Group =>
    ({
        ID: `group-${flags}`,
        Name: 'Example group',
        Description: '',
        Flags: flags,
    }) as Group;

export const permissionsWithout = (missingPermission: (typeof PERMISSIONS)[number]) =>
    getOrgPermissions(
        PERMISSIONS.filter((permission) => permission !== missingPermission),
        false
    );

type Options = {
    plan?: CataloguedPlan;
    hasReadableSubscription?: boolean;
    organization?: OrganizationExtended;
} & Partial<Omit<OrganizationRouterParams, 'entitlements' | 'subscription' | 'organization'>>;

export const buildOrganizationRouterParams = ({
    plan,
    hasReadableSubscription = true,
    organization,
    ...rest
}: Options = {}): OrganizationRouterParams => {
    const subscriptionPlan = hasReadableSubscription ? plan : undefined;

    return {
        app: APPS.PROTONACCOUNT,
        user: buildUser(),
        subscription: subscriptionPlan ? buildSubscription(subscriptionPlan) : undefined,
        allSubscriptions: subscriptionPlan ? [buildSubscription(subscriptionPlan)] : [],
        entitlements: buildEntitlementsForPlan(plan, subscriptionPlan),
        organization: organization ?? buildOrganizationWithKeys({ PlanName: plan }),
        isB2BDrive: false,
        isGroupOwner: null,
        isOrganizationOwner: false,
        memberships: undefined,
        groups: undefined,
        permissions: getOrgPermissions([], true),
        flags: defaultFlags,
        ...rest,
    };
};
