import { PLANS } from '@proton/payments';

const groupsCompatiblePlans = new Set([PLANS.MAIL_BUSINESS, PLANS.BUNDLE_PRO, PLANS.BUNDLE_PRO_2024, PLANS.VISIONARY]);

const vpnPlans = new Set([PLANS.VPN_BUSINESS, PLANS.VPN_PRO]);

const canUseGroups = (
    plan: PLANS | undefined,
    options: {
        isUserGroupsNoCustomDomainEnabled: boolean;
        hasGroups?: boolean;
    }
) => {
    const { isUserGroupsNoCustomDomainEnabled, hasGroups } = options;
    if (plan === undefined) {
        return false;
    }
    const isVpnPlan = vpnPlans.has(plan);

    // Show existing groups, but NOT for VPN plans when feature flag is disabled -- Breaks the page asking for the domains
    if (hasGroups && isVpnPlan && !isUserGroupsNoCustomDomainEnabled) {
        return false;
    }

    // The groups without custom domains initiative is being rolled out for VPN plans first,
    // as they want to create groups without custom domains. For this reason, the feature flag
    // for groups without custom domains controls whether a VPN user can use groups.
    // When we confirm that the feature is stable, we will remove the feature flag and add the VPN plans to the groupsCompatiblePlans set.
    // The vpnPlans set will then be removed.
    // The isUserGroupsNoCustomDomainEnabled should also be removed from this function and all callers updated.
    if (isUserGroupsNoCustomDomainEnabled && isVpnPlan) {
        return true;
    }

    if (groupsCompatiblePlans.has(plan)) {
        return true;
    }

    return false;
};

export default canUseGroups;
