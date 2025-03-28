import { c } from 'ttag';

import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';
import {
    APP_UPSELL_REF_PATH,
    BRAND_NAME,
    DRIVE_UPSELL_PATHS,
    MAIL_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import driveOfferSpotlight from '@proton/styles/assets/img/permanent-offer/drive_offer_spotlight.svg';
import mailOfferSpotlight from '@proton/styles/assets/img/permanent-offer/mail_offer_spotlight.svg';

import type { SupportedPlans } from './interface';

export const offerUpsellRef = {
    [PLANS.MAIL]: getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.PLUS_MONTHLY_SUBSCRIBER_NUDGE_VARIANT_MONEY,
    }),
    [PLANS.DRIVE]: getUpsellRef({
        app: APP_UPSELL_REF_PATH.DRIVE_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: DRIVE_UPSELL_PATHS.PLUS_MONTHLY_SUBSCRIBER_NUDGE_VARIANT_MONEY,
    }),
    [PLANS.BUNDLE]: getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.BUNDLE_MONTHLY_SUBSCRIBER_NUDGE_VARIANT_MONEY,
    }),
};

export const offerUpsellConfig = {
    [PLANS.MAIL]: {
        step: SUBSCRIPTION_STEPS.CHECKOUT,
        coupon: COUPON_CODES.ANNUALOFFER25,
        cycle: CYCLE.YEARLY,
        maximumCycle: CYCLE.YEARLY,
        minimumCycle: CYCLE.YEARLY,
        plan: PLANS.MAIL,
    },
    [PLANS.DRIVE]: {
        step: SUBSCRIPTION_STEPS.CHECKOUT,
        coupon: COUPON_CODES.ANNUALOFFER25,
        cycle: CYCLE.YEARLY,
        maximumCycle: CYCLE.YEARLY,
        minimumCycle: CYCLE.YEARLY,
        plan: PLANS.DRIVE,
    },
    [PLANS.BUNDLE]: {
        step: SUBSCRIPTION_STEPS.CHECKOUT,
        coupon: COUPON_CODES.ANNUALOFFER25,
        cycle: CYCLE.YEARLY,
        maximumCycle: CYCLE.YEARLY,
        minimumCycle: CYCLE.YEARLY,
        plan: PLANS.BUNDLE,
    },
};

export const offerSpotlightImg = {
    [PLANS.MAIL]: mailOfferSpotlight,
    [PLANS.DRIVE]: driveOfferSpotlight,
    [PLANS.BUNDLE]: mailOfferSpotlight,
};

export const getPlanCopy = (plan: SupportedPlans) => {
    if (plan === PLANS.MAIL) {
        const planName = PLAN_NAMES[PLANS.MAIL];
        return c('Offer').t`${planName} for 12 months`;
    } else if (plan === PLANS.DRIVE) {
        const planName = PLAN_NAMES[PLANS.DRIVE];
        return c('Offer').t`${planName} for 12 months`;
    } else if (plan === PLANS.BUNDLE) {
        return c('Offer').t`${BRAND_NAME} Unlimited for 12 months`;
    }

    return '';
};
