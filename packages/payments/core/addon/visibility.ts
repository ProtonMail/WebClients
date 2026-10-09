import { APPS } from '@proton/shared/lib/constants';

import { ADDON_PREFIXES, PLANS } from '../constants';
import { hasAddonFromPlanIDs } from '../plan/addons';
import { getAddonNameByPlan, getIsB2BAudienceFromPlanIDs, getPlanNameFromIDs } from '../plan/helpers';
import { hasNoExternallyManagedLumoSubscription } from '../subscription/helpers/external-management';
import { getPlanIDs } from '../subscription/helpers/plan-ids';
import type { AddonVisibilityRule } from './interfaces';

/** The selected plan sells this addon at all. */
export const planSupportsAddon =
    (addonType: ADDON_PREFIXES): AddonVisibilityRule =>
    ({ planIDs }) => {
        const planName = getPlanNameFromIDs(planIDs);
        return !!planName && !!getAddonNameByPlan(addonType, planName);
    };

/** Common coupon rule: hidden by coupon unless the addon is already selected. */
export const passesCouponGate =
    (addonType: ADDON_PREFIXES): AddonVisibilityRule =>
    ({ planIDs, bannerHiddenByCoupon }) =>
        !bannerHiddenByCoupon || hasAddonFromPlanIDs(addonType, planIDs);

/** Hidden when checkout is opened from Mail or Calendar (web app or their account dashboard), unless the
 *  selected plan is a business plan or the addon is already selected. */
export const notInMailOrCalendarContext =
    (addonType: ADDON_PREFIXES): AddonVisibilityRule =>
    ({ planIDs, app, subscription }) =>
        (app !== APPS.PROTONMAIL && app !== APPS.PROTONCALENDAR) ||
        getIsB2BAudienceFromPlanIDs(planIDs) ||
        hasAddonFromPlanIDs(addonType, planIDs) ||
        hasAddonFromPlanIDs(addonType, getPlanIDs(subscription));

/** Lumo-only: not an externally-managed subscription. */
export const notExternallyManagedLumo: AddonVisibilityRule = ({ subscription }) =>
    hasNoExternallyManagedLumoSubscription(subscription);

/** Domain on VPN Business: hidden during signup; otherwise shown only behind the flag or when the
 *  current subscription already has a domain addon (grandfathering). Other plans always show it. */
export const domainVpnBusinessGate: AddonVisibilityRule = ({ planIDs, subscription, featureFlagEnabled, isSignup }) => {
    if (getPlanNameFromIDs(planIDs) !== PLANS.VPN_BUSINESS) {
        return true;
    }
    if (isSignup) {
        return false;
    }
    return featureFlagEnabled || hasAddonFromPlanIDs(ADDON_PREFIXES.DOMAIN, getPlanIDs(subscription));
};
