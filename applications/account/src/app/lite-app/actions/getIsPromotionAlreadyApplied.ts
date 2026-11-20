import { type CYCLE, PLANS } from '@proton/payments/core/constants';
import { getPlan } from '@proton/payments/core/subscription/helpers';
import type { MultiSubscriptionContext } from '@proton/payments/core/subscription/multi-subscription-context';
import {
    getChangedSubscription,
    getSubscriptionChangedByPlan,
} from '@proton/payments/core/subscription/purchase-outcome';

const plusPlans = [PLANS.VPN2024, PLANS.MAIL, PLANS.DRIVE, PLANS.PASS, PLANS.VPN_PASS_BUNDLE, PLANS.LUMO];

export const getIsPromotionAlreadyApplied = ({
    multiSubscriptionContext,
    plan,
    requestedPlanName,
    cycle,
    coupon,
}: {
    multiSubscriptionContext: MultiSubscriptionContext;
    plan: PLANS | undefined;
    requestedPlanName: string;
    cycle: CYCLE | undefined;
    coupon: string | undefined;
}): boolean => {
    const changedSubscription = plan
        ? getSubscriptionChangedByPlan(multiSubscriptionContext, plan)
        : getChangedSubscription(multiSubscriptionContext, {});
    const activeSubscription = changedSubscription?.UpcomingSubscription ?? changedSubscription;
    const activeSubscriptionPlan = getPlan(activeSubscription);
    const activeSubscriptionSameCoupon = !!coupon && activeSubscription?.CouponCode === coupon;
    const takingSameOffer =
        !!activeSubscription &&
        !!activeSubscriptionPlan &&
        activeSubscriptionPlan.Name === plan &&
        activeSubscription.Cycle === cycle &&
        activeSubscriptionSameCoupon;

    const isOfferPlusPlan = !!requestedPlanName && plusPlans.some((planName) => planName === plan);
    const isOfferBundlePlan = !!requestedPlanName && plan === PLANS.BUNDLE;

    const isBundleDowngrade =
        activeSubscriptionPlan?.Name === PLANS.BUNDLE && isOfferPlusPlan && activeSubscriptionSameCoupon;

    const isFamilyDowngrade =
        activeSubscriptionPlan?.Name === PLANS.FAMILY &&
        (isOfferPlusPlan || isOfferBundlePlan) &&
        activeSubscriptionSameCoupon;

    const isVisionaryDowngrade =
        activeSubscriptionPlan?.Name === PLANS.VISIONARY &&
        !!requestedPlanName &&
        plan !== PLANS.VISIONARY &&
        activeSubscriptionSameCoupon;

    return takingSameOffer || isBundleDowngrade || isFamilyDowngrade || isVisionaryDowngrade;
};
