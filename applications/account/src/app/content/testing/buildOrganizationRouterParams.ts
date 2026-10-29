import { getOrgPermissions } from '@proton/account/userPermissions';
import { getUnreadableSubscriptionsReason } from '@proton/payments/core/entitlements/unreadable-subscriptions';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import {
    type CataloguedPlan,
    buildOrgAndUserEntitlementChecks,
} from '@proton/payments/testing/prodCatalogGrantsForTesting';
import { APPS, ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import type { Group, GroupFlags } from '@proton/shared/lib/interfaces/Group';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import { PERMISSIONS } from '@proton/shared/lib/interfaces/UserPermission';
import { buildUser } from '@proton/shared/testing/buildUser';

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
    organization?: OrganizationExtended;
} & Partial<Omit<OrganizationRouterParams, 'entitlements' | 'subscription' | 'organization'>>;

export const buildOrganizationRouterParams = ({
    plan,
    organization,
    ...rest
}: Options = {}): OrganizationRouterParams => {
    const user = rest.user ?? buildUser();
    const resolvedOrganization = organization ?? buildOrganizationWithKeys({ PlanName: plan });
    const canReadSubscriptions =
        getUnreadableSubscriptionsReason({ user, organization: resolvedOrganization }) === undefined;
    const subscriptionPlan = canReadSubscriptions ? plan : undefined;

    return {
        app: APPS.PROTONACCOUNT,
        user,
        subscription: subscriptionPlan ? buildSubscription(subscriptionPlan) : undefined,
        allSubscriptions: subscriptionPlan ? [buildSubscription(subscriptionPlan)] : [],
        entitlements: buildOrgAndUserEntitlementChecks({
            subscriptionPlans: plan ? [plan] : [],
            user,
            organization: resolvedOrganization,
        }),
        organization: resolvedOrganization,
        isGroupOwner: null,
        isOrganizationOwner: false,
        memberships: undefined,
        groups: undefined,
        permissions: getOrgPermissions([], true),
        flags: defaultFlags,
        ...rest,
    };
};
