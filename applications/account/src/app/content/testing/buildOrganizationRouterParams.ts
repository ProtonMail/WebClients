import { buildUser } from '@proton/account/testing/buildUser';
import { getOrgPermissions } from '@proton/account/userPermissions';
import type { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { createEntitlementResolverForOrgAndUser } from '@proton/payments/core/entitlements/resolver';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { makeEntitlements } from '@proton/payments/testing/makeEntitlements';
import {
    type CataloguedPlan,
    prodCatalogGrants,
    toOrganizationEntitlement,
} from '@proton/payments/testing/prodCatalogGrants';
import { APPS, ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import type { Group, GroupFlags } from '@proton/shared/lib/interfaces/Group';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import { PERMISSIONS } from '@proton/shared/lib/interfaces/UserPermission';

import type { Flags, OrganizationRouterParams } from '../router-params';

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
    isLumoApiEnabled: false,
};

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
