import { c, msgid } from 'ttag';

import {
    BRAND_NAME,
    CALENDAR_APP_NAME,
    DARK_WEB_MONITORING_NAME,
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
import {
    getDefaultConfirmationModal,
    getDefaultGBStorageWarning,
    getDefaultReminder,
    getDefaultTestimonial,
} from './b2bCommonConfig';

export const getBundleProConfig = (
    subscription: SubscriptionModel,
    plan: SubscriptionPlan & { Name: PLANS },
    newCancellationPolicy?: boolean
): PlanConfig => {
    const currentPlan = PLANS.BUNDLE_PRO_2024;
    const planName = PLAN_NAMES[currentPlan];
    const planMaxSpace = humanSize({ bytes: plan.MaxSpace, unit: 'GB', fraction: 0 });

    const reminder = getDefaultReminder(planName);
    const testimonials: PlanConfigTestimonial = getDefaultTestimonial(planName);

    const { MaxDomains: maxDomainNames, MaxCalendars } = plan;
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
                text: c('Subscription reminder').t`20 email addresses per user`,
            },
            {
                icon: 'globe',
                text: c('Subscription reminder').ngettext(
                    msgid`${maxDomainNames} custom email domain`,
                    `${maxDomainNames} custom email domains`,
                    maxDomainNames
                ),
            },
            {
                icon: 'calendar-grid',
                text: c('Subscription reminder').ngettext(
                    msgid`${MaxCalendars} calendar per user`,
                    `${MaxCalendars} calendars per user`,
                    MaxCalendars
                ),
            },
            {
                icon: 'brand-proton-mail',
                text: c('Subscription reminder').t`${MAIL_APP_NAME} with automatic email forwarding`,
            },
            {
                icon: 'brand-proton-calendar',
                text: c('Subscription reminder').t`${CALENDAR_APP_NAME} with calendar sharing and availability`,
            },
            {
                icon: 'brand-proton-drive',
                text: c('Subscription reminder').t`${DRIVE_APP_NAME} with version history`,
            },
            {
                icon: 'brand-proton-pass',
                text: c('Subscription reminder').t`${PASS_APP_NAME} with ${DARK_WEB_MONITORING_NAME}`,
            },
            {
                icon: 'brand-proton-vpn',
                text: c('Subscription reminder').t`${VPN_APP_NAME} with malware and ad-blocking`,
            },
            {
                icon: 'shield-half-filled',
                text: c('Subscription reminder').t`${PROTON_SENTINEL_NAME} program`,
            },
            {
                icon: 'life-ring',
                text: c('Subscription reminder').t`Priority support`,
            },
        ],
    };

    const tempStorage = getDefaultGBStorageWarning(planName, planMaxSpace, newCancellationPolicy);
    const storage: PlanConfigStorage = {
        ...tempStorage,
        description: c('Subscription reminder')
            .t`${planName} offers ${planMaxSpace} storage per user for emails, attachments, events, files, and passwords. You are also eligible for yearly storage bonuses.`,
    };

    const confirmationModal: ConfirmationModal = getDefaultConfirmationModal(
        subscription,
        planName,
        newCancellationPolicy
    );

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
