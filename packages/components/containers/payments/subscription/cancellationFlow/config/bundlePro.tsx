import { c, msgid } from 'ttag';

import { PLANS, PLAN_NAMES } from '@proton/payments';
import {
    APPS,
    BRAND_NAME,
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
    getDefaultGBStorageWarning,
    getDefaultReminder,
    getDefaultTestimonial,
} from './b2bCommonConfig';
import type { ConfigProps, UpsellPlans } from './types';

const upsellPlans: UpsellPlans = {
    [APPS.PROTONMAIL]: PLANS.MAIL_BUSINESS,
};

export const getBundleProConfig = ({ app, plan, subscription, user }: ConfigProps): PlanConfig => {
    const currentPlan = PLANS.BUNDLE_PRO_2024;
    const planName = PLAN_NAMES[currentPlan];
    const planMaxSpace = humanSize({ bytes: plan.MaxSpace, unit: 'GB', fraction: 0 });
    const planNumberOfEmails = plan.MaxAddresses;
    const planNumberOfDomains = plan.MaxDomains;
    const planNumberOfCalendars = plan.MaxCalendars;

    const reminder = getDefaultReminder(planName);
    const testimonials: PlanConfigTestimonial = getDefaultTestimonial(planName);

    const features: PlanConfigFeatures = {
        title: c('Subscription reminder').t`Productivity features`,
        description: c('Subscription reminder')
            .t`${planName} gives your team what they need to be more productive and organized in their work with access to all ${BRAND_NAME} apps and their premium features.`,
        features: [
            {
                icon: 'storage',
                text: c('Subscription reminder').t`${planMaxSpace} storage per user`,
            },
            {
                icon: 'envelopes',
                text: c('Subscription reminder').ngettext(
                    msgid`${planNumberOfEmails} email address per user`,
                    `${planNumberOfEmails} email addresses per user`,
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
                text: c('Subscription reminder').t`Catch-all email address`,
            },
            {
                icon: 'tv',
                text: c('Subscription reminder').t`Desktop app and email client support (via IMAP)`,
            },
            {
                icon: 'envelope-arrow-up-and-right',
                text: c('Subscription reminder').t`Automatic email forwarding`,
            },
            {
                icon: 'calendar-grid',
                text: c('Subscription reminder').ngettext(
                    msgid`${planNumberOfCalendars} calendar per user`,
                    `${planNumberOfCalendars} calendars per user`,
                    planNumberOfCalendars
                ),
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
                icon: 'app-switch',
                text: c('Subscription reminder')
                    .t`${CALENDAR_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, and ${VPN_SHORT_APP_NAME} with premium features`,
            },
        ],
    };

    const cancellablePlan = hasCancellablePlan(subscription, user);
    const tempStorage = getDefaultGBStorageWarning(planName, planMaxSpace, cancellablePlan);
    const storage: PlanConfigStorage = {
        ...tempStorage,
        description: c('Subscription reminder')
            .t`${planName} offers ${planMaxSpace} storage per user for emails, attachments, events, files, and passwords. You are also eligible for yearly storage bonuses.`,
    };

    const confirmationModal: ConfirmationModal = getDefaultConfirmationModal(subscription, planName, cancellablePlan);

    return {
        planName,
        reminder,
        testimonials,
        features,
        storage,
        confirmationModal,
        plan: currentPlan,
        upsellPlan: app && upsellPlans[app],
    };
};
