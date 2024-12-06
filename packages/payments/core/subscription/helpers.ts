import { getPrimaryPlan, hasLifetimeCoupon } from '@proton/shared/lib/helpers/subscription';
import { type Subscription, type UserModel } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';

import { ADDON_NAMES, PLANS, PLAN_NAMES } from '../constants';
import { type FreeSubscription } from '../interface';
import { isFreeSubscription } from '../type-guards';

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

export const getLumoAddonNameByPlan = (planName: PLANS) => {
    switch (planName) {
        // B2C
        case PLANS.MAIL:
            return ADDON_NAMES.LUMO_MAIL;
        case PLANS.DRIVE:
            return ADDON_NAMES.LUMO_DRIVE;
        case PLANS.PASS:
            return ADDON_NAMES.LUMO_PASS;
        case PLANS.VPN:
            return ADDON_NAMES.LUMO_VPN;
        case PLANS.VPN2024:
            return ADDON_NAMES.LUMO_VPN2024;
        case PLANS.BUNDLE:
            return ADDON_NAMES.LUMO_BUNDLE;
        case PLANS.FAMILY:
            return ADDON_NAMES.LUMO_FAMILY;
        case PLANS.DUO:
            return ADDON_NAMES.LUMO_DUO;

        // B2B
        case PLANS.MAIL_PRO:
            return ADDON_NAMES.LUMO_MAIL_PRO;
        case PLANS.MAIL_BUSINESS:
            return ADDON_NAMES.LUMO_MAIL_BUSINESS;
        case PLANS.DRIVE_PRO:
            return ADDON_NAMES.LUMO_DRIVE_PRO;
        case PLANS.DRIVE_BUSINESS:
            return ADDON_NAMES.LUMO_DRIVE_BUSINESS;
        case PLANS.BUNDLE_PRO:
            return ADDON_NAMES.LUMO_BUNDLE_PRO;
        case PLANS.BUNDLE_PRO_2024:
            return ADDON_NAMES.LUMO_BUNDLE_PRO_2024;
        case PLANS.VPN_PRO:
            return ADDON_NAMES.LUMO_VPN_PRO;
        case PLANS.VPN_BUSINESS:
            return ADDON_NAMES.LUMO_VPN_BUSINESS;
        case PLANS.PASS_PRO:
            return ADDON_NAMES.LUMO_PASS_PRO;
        case PLANS.PASS_BUSINESS:
            return ADDON_NAMES.LUMO_PASS_BUSINESS;
    }
};
