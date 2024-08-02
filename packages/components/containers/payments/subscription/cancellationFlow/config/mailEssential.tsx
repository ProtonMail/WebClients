import { PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { hasCancellablePlan } from '@proton/shared/lib/helpers/subscription';
import type { SubscriptionModel, SubscriptionPlan, UserModel } from '@proton/shared/lib/interfaces';

import type {
    ConfirmationModal,
    PlanConfig,
    PlanConfigFeatures,
    PlanConfigStorage,
    PlanConfigTestimonial,
} from '../interface';
import {
    getDefaultConfirmationModal,
    getDefaultFeatures,
    getDefaultGBStorageWarning,
    getDefaultReminder,
    getDefaultTestimonial,
} from './b2bCommonConfig';

export const getMailEssentialConfig = (
    subscription: SubscriptionModel,
    user: UserModel,
    plan: SubscriptionPlan & { Name: PLANS }
): PlanConfig => {
    const currentPlan = PLANS.MAIL_PRO;
    const planName = PLAN_NAMES[currentPlan];
    const planMaxSpace = humanSize({ bytes: plan.MaxSpace, unit: 'GB', fraction: 0 });

    const reminder = getDefaultReminder(planName);
    const testimonials: PlanConfigTestimonial = getDefaultTestimonial(planName);

    const featuresTemp: PlanConfigFeatures = getDefaultFeatures(
        planName,
        planMaxSpace,
        plan.MaxAddresses,
        plan.MaxDomains
    );
    const features: PlanConfigFeatures = {
        ...featuresTemp,
        features: [...featuresTemp.features.filter(({ icon }) => icon !== 'shield-half-filled')],
    };

    const cancellablePlan = hasCancellablePlan(subscription, user);
    const storage: PlanConfigStorage = getDefaultGBStorageWarning(planName, planMaxSpace, cancellablePlan);
    const confirmationModal: ConfirmationModal = getDefaultConfirmationModal(subscription, planName, cancellablePlan);

    return {
        planName,
        reminder,
        testimonials,
        features,
        storage,
        confirmationModal,
        plan: currentPlan,
    };
};
