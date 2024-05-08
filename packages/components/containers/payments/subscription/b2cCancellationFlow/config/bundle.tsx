import { c } from 'ttag';

import {
    CALENDAR_APP_NAME,
    DRIVE_APP_NAME,
    MAIL_APP_NAME,
    PASS_APP_NAME,
    PLANS,
    PLAN_NAMES,
    PROTON_SENTINEL_NAME,
    VPN_APP_NAME,
} from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { SubscriptionModel, SubscriptionPlan } from '@proton/shared/lib/interfaces';

import {
    ConfirmationModal,
    PlanConfig,
    PlanConfigFeatures,
    PlanConfigStorage,
    PlanConfigTestimonial,
} from '../interface';
import { getDefaultConfirmationModal, getDefaultGBStorageWarning, getDefaultTestimonial } from './commonConfig';

export const getBundleConfig = (
    subscription: SubscriptionModel,
    plan: SubscriptionPlan & { Name: PLANS },
    vpnCountries: number
): PlanConfig => {
    const planName = PLAN_NAMES[PLANS.BUNDLE];
    const planMaxSpace = humanSize({ bytes: plan.MaxSpace, unit: 'GB', fraction: 0 });

    const reminder = {
        title: c('Subscription reminder').t`What you give up when you cancel ${planName}`,
    };

    const testimonials: PlanConfigTestimonial = getDefaultTestimonial();

    const features: PlanConfigFeatures = {
        title: c('Subscription reminder').t`Comprehensive privacy and security`,
        description: c('Subscription reminder')
            .t`${planName} gives you access to all apps and premium features. Privacy is built-in so you can get on with it, knowing your data and identity are safe.`,
        features: [
            {
                icon: 'storage',
                text: c('Subscription reminder').t`${planMaxSpace} total storage`,
            },
            {
                icon: 'gift',
                text: c('Subscription reminder').t`Yearly free storage bonuses`,
            },
            {
                icon: 'shield-half-filled',
                text: c('Subscription reminder').t`${PROTON_SENTINEL_NAME} program`,
            },
            {
                icon: 'life-ring',
                text: c('Subscription reminder').t`Priority support`,
            },
            {
                icon: 'brand-proton-mail',
                text: c('Subscription reminder').t`${MAIL_APP_NAME} and all premium productivity features`,
            },
            {
                icon: 'brand-proton-calendar',
                text: c('Subscription reminder').t`${CALENDAR_APP_NAME} including calendar sharing`,
            },
            {
                icon: 'brand-proton-drive',
                text: c('Subscription reminder').t`${DRIVE_APP_NAME} including version history`,
            },
            {
                icon: 'brand-proton-pass',
                text: c('Subscription reminder').t`${PASS_APP_NAME} including unlimited hide-my-email aliases`,
            },
            {
                icon: 'brand-proton-vpn',
                text: c('Subscription reminder')
                    .t`${VPN_APP_NAME} with access to all high-speed servers in ${vpnCountries} countries`,
            },
        ],
    };

    const storage: PlanConfigStorage = getDefaultGBStorageWarning(planName, planMaxSpace);
    const confirmationModal: ConfirmationModal = getDefaultConfirmationModal(subscription, planName);

    return {
        plan: PLANS.BUNDLE,
        reminder,
        testimonials,
        features,
        storage,
        confirmationModal,
        keepPlanCTA: c('Subscription reminder').t`Keep ${planName}`,
        keepPlanCTAIcon: 'upgrade',
        redirectModal: c('Subscription reminder').t`Resubscribe to restore access to ${planName} features.`,
    };
};
