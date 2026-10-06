import { PLANS } from '@proton/payments/core/constants';

const vpnPlans = new Set([PLANS.VPN_BUSINESS, PLANS.VPN_PRO, PLANS.VPN_PASS_BUNDLE_BUSINESS]);

const canUseGroups = (
    plan: PLANS | undefined,
    options: {
        orgHasGroupsEntitlement: boolean;
        isUserGroupsNoCustomDomainEnabled: boolean;
    }
) => {
    const { orgHasGroupsEntitlement, isUserGroupsNoCustomDomainEnabled } = options;

    // The `groups` entitlement is the source of truth for whether the plan includes the feature.
    if (!orgHasGroupsEntitlement) {
        return false;
    }

    // The groups without custom domains initiative is being rolled out for VPN plans first,
    // as they want to create groups without custom domains. For this reason, the feature flag
    // for groups without custom domains controls whether a VPN user can use groups.
    // Showing the page to them while the flag is off breaks it, as it asks for a domain.
    // When we confirm that the feature is stable, we will remove the feature flag, and the
    // entitlement above becomes the only gate. The vpnPlans set will then be removed.
    if (plan !== undefined && vpnPlans.has(plan)) {
        return isUserGroupsNoCustomDomainEnabled;
    }

    return true;
};

export default canUseGroups;
