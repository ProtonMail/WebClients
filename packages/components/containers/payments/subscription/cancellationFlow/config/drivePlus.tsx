import { c } from 'ttag';

import { BRAND_NAME, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import type { SubscriptionModel, SubscriptionPlan } from '@proton/shared/lib/interfaces';

import type { ConfirmationModal, PlanConfig, PlanConfigFeatures, PlanConfigTestimonial } from '../interface';
import { getDefaultConfirmationModal, getDefaultReminder, getDefaultTestimonial } from './b2cCommonConfig';

export const getDrivePlusConfig = (
    subscription: SubscriptionModel,
    plan: SubscriptionPlan & { Name: PLANS },
    newCancellationPolicy?: boolean
): PlanConfig => {
    const currentPlan = PLANS.DRIVE;
    const planName = PLAN_NAMES[currentPlan];
    const planMaxSpace = humanSize({ bytes: plan.MaxSpace, unit: 'GB', fraction: 0 });

    const reminder = getDefaultReminder(planName);
    const testimonials: PlanConfigTestimonial = getDefaultTestimonial();

    const confirmationModal: ConfirmationModal = {
        ...getDefaultConfirmationModal(subscription, planName, newCancellationPolicy),
        warningPoints: [
            c('Subscription reminder').t`Sync files on devices`,
            c('Subscription reminder').t`Add any new files`,
            c('Subscription reminder').t`Back up photos from your devices`,
        ],
    };

    const extraWarning = newCancellationPolicy
        ? c('Subscription reminder')
              .t`After your ${planName} subscription expires, you will be downgraded to ${BRAND_NAME} Free, which only offers up to 5 GB of Drive storage and up to 1 GB of Mail storage. You will also lose any previously awarded storage bonuses.`
        : c('Subscription reminder')
              .t`When you cancel ${planName}, you will be downgraded to ${BRAND_NAME} Free, which only offers up to 5 GB of Drive storage and up to 1 GB of Mail storage. You will also lose any previously awarded storage bonuses.`;

    const features: PlanConfigFeatures = {
        title: c('Subscription reminder').t`Extra storage and bonuses`,
        description: c('Subscription reminder')
            .t`${planName} offers ${planMaxSpace} storage for your files and photos. You are also eligible for yearly storage bonuses.`,
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
                icon: 'clock',
                text: c('Subscription reminder').t`Version history`,
            },
            {
                icon: 'life-ring',
                text: c('Subscription reminder').t`Priority support`,
            },
        ],
        extraWarning,
    };

    return {
        planName,
        reminder,
        testimonials,
        features,
        confirmationModal,
        plan: currentPlan,
    };
};
