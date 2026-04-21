import { c, msgid } from 'ttag';

import { PLANS, PLAN_NAMES, hasCancellablePlan } from '@proton/payments';
import {
    APPS,
    BRAND_NAME,
    CALENDAR_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    LUMO_APP_NAME,
    MEET_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    PROTON_SENTINEL_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { PAID_PREMIUM_MAX_PARTICIPANTS } from '../../../features/meet';
import { getPrioritySupport } from '../../../features/shared';
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
    [APPS.PROTONMAIL]: PLANS.BUNDLE_PRO_2024,
};

export const getBundleBizConfig = ({ app, plan, subscription }: ConfigProps): PlanConfig => {
    const currentPlan = PLANS.BUNDLE_BIZ_2025;
    const planName = PLAN_NAMES[currentPlan];
    const planMaxSpace = humanSize({ bytes: plan.MaxSpace, unit: 'TB', fraction: 0 });
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
                icon: 'video-camera',
                text: c('Subscription reminder').ngettext(
                    msgid`Video meetings, up to ${PAID_PREMIUM_MAX_PARTICIPANTS} participant`,
                    `Video meetings, up to ${PAID_PREMIUM_MAX_PARTICIPANTS} participants`,
                    PAID_PREMIUM_MAX_PARTICIPANTS
                ),
            },
            {
                icon: 'magic-wand',
                text: c('Subscription reminder').t`${BRAND_NAME} Scribe writing assistant`,
            },
            {
                icon: 'shield-half-filled',
                text: c('Subscription reminder').t`${PROTON_SENTINEL_NAME} advanced account protection`,
            },
            getPrioritySupport(),
            {
                icon: 'app-switch',
                text: c('Subscription reminder')
                    .t`${CALENDAR_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, ${MEET_SHORT_APP_NAME}, and ${LUMO_APP_NAME} with premium features`,
            },
        ],
    };

    const cancellablePlan = hasCancellablePlan(subscription);
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
