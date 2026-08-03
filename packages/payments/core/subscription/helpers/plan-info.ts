import { hasBit } from '@proton/shared/lib/helpers/bitset';

import { LIFETIME_PLAN_TITLE, type PLANS, type PLAN_SERVICES, PLAN_TYPES } from '../../constants';
import { hasLifetimeCoupon } from '../../coupons';
import type { SubscriptionPlan } from '../../plan/interface';
import type { MaybeFreeSubscription, Subscription } from '../interface';

export function getPlan(subscription: MaybeFreeSubscription, service?: PLAN_SERVICES) {
    const result = (subscription?.Plans || []).find(
        ({ Services, Type }) => Type === PLAN_TYPES.PLAN && (service === undefined ? true : hasBit(Services, service))
    );
    if (result) {
        return result as SubscriptionPlan & { Name: PLANS };
    }
    return result;
}

export const getPlanName = (subscription: MaybeFreeSubscription, service?: PLAN_SERVICES) => {
    const plan = getPlan(subscription, service);
    return plan?.Name;
};

export const getPlanTitle = (subscription: MaybeFreeSubscription) => {
    const plan = getPlan(subscription);
    return hasLifetimeCoupon(subscription) ? LIFETIME_PLAN_TITLE : plan?.Title;
};

export const getAddons = (subscription: Subscription | undefined) =>
    (subscription?.Plans || []).filter(({ Type }) => Type === PLAN_TYPES.ADDON);
