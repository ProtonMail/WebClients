import { c } from 'ttag';

import { IcClock } from '@proton/icons/icons/IcClock';
import { IcGift } from '@proton/icons/icons/IcGift';
import { IcStorage } from '@proton/icons/icons/IcStorage';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { hasCancellablePlan } from '@proton/payments/core/subscription/helpers';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { getPrioritySupport } from '../../../features/shared';
import type { ConfirmationModal, PlanConfig, PlanConfigFeatures, PlanConfigTestimonial } from '../interface';
import { getDefaultConfirmationModal, getDefaultReminder, getDefaultTestimonial } from './b2cCommonConfig';
import type { ConfigProps } from './types';

export const getDrivePlusConfig = ({ plan, subscription }: ConfigProps): PlanConfig => {
    const currentPlan = PLANS.DRIVE;
    const planName = PLAN_NAMES[currentPlan];
    const planMaxSpace = humanSize({ bytes: plan.MaxSpace, unit: 'GB', fraction: 0 });

    const reminder = getDefaultReminder(planName);
    const testimonials: PlanConfigTestimonial = getDefaultTestimonial();

    const cancellablePlan = hasCancellablePlan(subscription);

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
                icon: IcStorage,
                text: c('Subscription reminder').t`${planMaxSpace} total storage`,
            },
            {
                icon: IcGift,
                text: c('Subscription reminder').t`Yearly free storage bonuses`,
            },
            {
                icon: IcClock,
                text: c('Subscription reminder').t`Version history`,
            },
            getPrioritySupport(),
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
