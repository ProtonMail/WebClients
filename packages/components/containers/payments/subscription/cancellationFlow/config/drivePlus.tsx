import { c } from 'ttag';

import { PLANS, PLAN_NAMES } from '@proton/payments';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { hasCancellablePlan } from '@proton/shared/lib/helpers/subscription';

import type { ConfirmationModal, PlanConfig, PlanConfigFeatures, PlanConfigTestimonial } from '../interface';
import { getDefaultConfirmationModal, getDefaultReminder, getDefaultTestimonial } from './b2cCommonConfig';
import type { ConfigProps } from './types';

export const getDrivePlusConfig = ({ plan, subscription, user }: ConfigProps): PlanConfig => {
    const currentPlan = PLANS.DRIVE;
    const planName = PLAN_NAMES[currentPlan];
    const planMaxSpace = humanSize({ bytes: plan.MaxSpace, unit: 'GB', fraction: 0 });

    const reminder = getDefaultReminder(planName);
    const testimonials: PlanConfigTestimonial = getDefaultTestimonial();

    const cancellablePlan = hasCancellablePlan(subscription, user);

    const confirmationModal: ConfirmationModal = {
        ...getDefaultConfirmationModal(subscription, planName, cancellablePlan),
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
            {
                icon: 'life-ring',
                text: c('Subscription reminder').t`Priority support`,
            },
        ],
    };

    return {
        confirmationModal,
        features,
        plan: currentPlan,
        planName,
        reminder,
        testimonials,
    };
};
