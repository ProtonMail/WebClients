import type { ADDON_NAMES } from '../../constants';
import { PLANS } from '../../constants';
import type { MaybeFreeSubscription } from '../interface';
import {
    hasAnyB2bBundle,
    hasBundleBiz2025,
    hasDeprecatedVPN,
    hasDriveBusiness,
    hasDrivePro,
    hasMailBusiness,
    hasMailPro,
    hasMeet,
    hasMeetBusiness,
    hasPassBusiness,
    hasPassPro,
    hasVPN2024,
    hasVPNPassBundle,
    hasVPNPassProfessional,
    hasVpnBusiness,
    hasVpnPro,
} from './plan-matching';

export const getHasVpnB2BPlan = (subscription: MaybeFreeSubscription) => {
    return hasVpnPro(subscription) || hasVpnBusiness(subscription) || hasVPNPassProfessional(subscription);
};

export const getHasVpnOnlyB2BPlan = (subscription: MaybeFreeSubscription) => {
    return hasVpnPro(subscription) || hasVpnBusiness(subscription);
};

export const getHasConsumerVpnPlan = (subscription: MaybeFreeSubscription) => {
    return hasDeprecatedVPN(subscription) || hasVPN2024(subscription) || hasVPNPassBundle(subscription);
};

export const getHasPassB2BPlan = (subscription: MaybeFreeSubscription) => {
    return hasPassPro(subscription) || hasPassBusiness(subscription) || hasVPNPassProfessional(subscription);
};

export const getHasDriveB2BPlan = (subscription: MaybeFreeSubscription) => {
    return hasDrivePro(subscription) || hasDriveBusiness(subscription);
};

export const getHasMeetIncludedInPlan = (subscription: MaybeFreeSubscription) => {
    return hasMeet(subscription) || hasMeetBusiness(subscription) || hasBundleBiz2025(subscription);
};

const externalMemberB2BPlans: Set<PLANS | ADDON_NAMES> = new Set([
    PLANS.VPN_PRO,
    PLANS.VPN_BUSINESS,
    PLANS.DRIVE_PRO,
    PLANS.DRIVE_BUSINESS,
    PLANS.PASS_PRO,
    PLANS.PASS_BUSINESS,
    PLANS.LUMO_BUSINESS,
    PLANS.VPN_PASS_BUNDLE_BUSINESS,
    PLANS.MEET,
    PLANS.MEET_BUSINESS,
]);
export const getHasExternalMemberCapableB2BPlan = (subscription: MaybeFreeSubscription) => {
    return subscription?.Plans?.some((plan) => externalMemberB2BPlans.has(plan.Name)) || false;
};

export const getHasMailB2BPlan = (subscription: MaybeFreeSubscription) => {
    return hasMailPro(subscription) || hasMailBusiness(subscription);
};

export const getHasInboxB2BPlan = (subscription: MaybeFreeSubscription) => {
    return hasAnyB2bBundle(subscription) || getHasMailB2BPlan(subscription);
};
