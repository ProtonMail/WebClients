import { c, msgid } from 'ttag';

import { PLANS, PLAN_NAMES } from '@proton/payments';
import {
    APPS,
    CALENDAR_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    PROTON_SENTINEL_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { hasCancellablePlan } from '@proton/shared/lib/helpers/subscription';

import type {
    ConfirmationModal,
    PlanConfig,
    PlanConfigFeatures,
    PlanConfigStorage,
    PlanConfigTestimonial,
} from '../interface';
import {
    getDefaultConfirmationModal,
    getDefaultReminder,
    getDefaultTBStorageWarning,
    getDefaultTestimonial,
} from './b2cCommonConfig';
import type { ConfigProps, UpsellPlans } from './types';

export const getDuoConfig = ({ app, plan, subscription, user }: ConfigProps): PlanConfig => {
    const currentPlan = PLANS.DUO;
    const planName = PLAN_NAMES[currentPlan];
    const planMaxSpace = humanSize({ bytes: plan.MaxSpace, unit: 'TB', fraction: 0 });
    const planNumberOfEmails = plan.MaxAddresses;
    const planNumberOfDomains = plan.MaxDomains;

    const reminder = getDefaultReminder(planName);
    const testimonials: PlanConfigTestimonial = getDefaultTestimonial();

    const upsellPlans: UpsellPlans = {
        [APPS.PROTONMAIL]: PLANS.BUNDLE,
    };

    const features: PlanConfigFeatures = {
        title: c('Subscription reminder').t`Unlimited privacy for two`,
        description: c('Subscription reminder')
            .t`${planName} gives you unlimited privacy and more storage for up to 2 people.`,
        features: [
            {
                icon: 'storage',
                text: c('Subscription reminder').t`${planMaxSpace} total storage`,
            },
            {
                icon: 'users',
                text: c('Subscription reminder').t`2 users`,
            },
            {
                icon: 'shield-half-filled',
                text: c('Subscription reminder').t`${PROTON_SENTINEL_NAME} advanced account protection`,
            },
            {
                icon: 'life-ring',
                text: c('Subscription reminder').t`Priority support`,
            },
            {
                icon: 'envelopes',
                text: c('Subscription reminder').ngettext(
                    msgid`${planNumberOfEmails} email address`,
                    `${planNumberOfEmails} email addresses`,
                    planNumberOfEmails
                ),
            },
            {
                icon: 'folders',
                text: c('Subscription reminder').t`Folders, labels, and custom filters`,
            },
            {
                icon: 'globe',
                text: c('Subscription reminder').ngettext(
                    msgid`${planNumberOfDomains} custom email domain`,
                    `${planNumberOfDomains} custom email domains`,
                    planNumberOfDomains
                ),
            },
            {
                icon: 'at',
                text: c('Subscription reminder').t`Your own short @pm.me email alias`,
            },
            {
                icon: 'app-switch',
                text: c('Subscription reminder')
                    .t`${CALENDAR_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, and ${VPN_SHORT_APP_NAME} with premium features`,
            },
        ],
    };

    const cancellablePlan = hasCancellablePlan(subscription, user);
    const storage: PlanConfigStorage = getDefaultTBStorageWarning(planName, planMaxSpace, cancellablePlan);
    const confirmationModal: ConfirmationModal = getDefaultConfirmationModal(subscription, planName, cancellablePlan);

    return {
        confirmationModal,
        features,
        plan: currentPlan,
        planName,
        reminder,
        storage,
        testimonials,
        upsellPlan: app && upsellPlans[app],
    };
};
