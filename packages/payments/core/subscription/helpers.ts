import { getPrimaryPlan, hasLifetimeCoupon } from '@proton/shared/lib/helpers/subscription';
import { type Subscription, type UserModel } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';

import { ADDON_NAMES, PLANS, PLAN_NAMES } from '../constants';
import { isFreeSubscription } from '../helpers';
import { type FreeSubscription } from '../interface';

export const getScribeAddonNameByPlan = (planName: PLANS) => {
    switch (planName) {
        case PLANS.MAIL_PRO:
            return ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO;
        case PLANS.BUNDLE_PRO:
            return ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO;
        case PLANS.BUNDLE_PRO_2024:
            return ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024;
        case PLANS.MAIL_BUSINESS:
            return ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS;
    }
};

export function getSubscriptionPlanTitle(
    user: UserModel,
    subscription: Subscription | FreeSubscription | undefined
): {
    planTitle?: string;
    planName?: PLANS;
} {
    const primaryPlan = (() => {
        if (user.isPaid && !isFreeSubscription(subscription)) {
            return getPrimaryPlan(subscription) ?? FREE_PLAN;
        } else if (user.hasPassLifetime) {
            return {
                Title: PLAN_NAMES[PLANS.PASS_LIFETIME],
                Name: PLANS.PASS_LIFETIME,
            };
        } else if (user.isFree) {
            return FREE_PLAN;
        }
    })();

    const planTitle = hasLifetimeCoupon(subscription) ? 'Lifetime' : primaryPlan?.Title;

    return {
        planTitle,
        planName: primaryPlan?.Name,
    };
}
