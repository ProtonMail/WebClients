import { c } from 'ttag';

import { BRAND_NAME, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { SubscriptionModel, SubscriptionPlan } from '@proton/shared/lib/interfaces';

import { ConfirmationModal, PlanConfig, PlanConfigFeatures, PlanConfigTestimonial } from '../interface';
import { getDefaultConfirmationModal, getDefaultTestimonial } from './commonConfig';

export const getDrivePlusConfig = (
    subscription: SubscriptionModel,
    plan: SubscriptionPlan & { Name: PLANS }
): PlanConfig => {
    const planName = PLAN_NAMES[PLANS.DRIVE];
    const planMaxSpace = humanSize({ bytes: plan.MaxSpace, unit: 'GB', fraction: 0 });

    const reminder = {
        title: c('Subscription reminder').t`What you give up when you cancel ${planName}`,
    };

    const testimonials: PlanConfigTestimonial = getDefaultTestimonial();

    const confirmationModal: ConfirmationModal = {
        ...getDefaultConfirmationModal(subscription, planName),
        warningPoints: [
            c('Subscription reminder').t`Sync files on devices`,
            c('Subscription reminder').t`Add any new files`,
            c('Subscription reminder').t`Back up photos from your devices`,
        ],
    };

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
        ],
        extraWarning: c('Subscription reminder')
            .t`When you cancel ${planName}, you will be downgraded to ${BRAND_NAME} Free, which only offers up to 5 GB of Drive storage and up to 1 GB of Mail storage. You will also lose any previously awarded storage bonuses.`,
    };

    return {
        plan: PLANS.DRIVE,
        reminder,
        testimonials,
        features,
        confirmationModal,
        keepPlanCTA: c('Subscription reminder').t`Keep ${planName}`,
        keepPlanCTAIcon: 'upgrade',
        redirectModal: c('Subscription reminder').t`Resubscribe to restore access to ${planName} features.`,
    };
};
