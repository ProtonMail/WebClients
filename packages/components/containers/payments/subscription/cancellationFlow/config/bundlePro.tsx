import { c, msgid } from 'ttag';

import { IcAppSwitch } from '@proton/icons/icons/IcAppSwitch';
import { IcAt } from '@proton/icons/icons/IcAt';
import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';
import { IcEnvelopeArrowUpAndRight } from '@proton/icons/icons/IcEnvelopeArrowUpAndRight';
import { IcEnvelopes } from '@proton/icons/icons/IcEnvelopes';
import { IcFolders } from '@proton/icons/icons/IcFolders';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcShieldHalfFilled } from '@proton/icons/icons/IcShieldHalfFilled';
import { IcStorage } from '@proton/icons/icons/IcStorage';
import { IcTv } from '@proton/icons/icons/IcTv';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { hasCancellablePlan } from '@proton/payments/core/subscription/helpers';
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
    [APPS.PROTONMAIL]: PLANS.MAIL_BUSINESS,
};

export const getBundleProConfig = ({ app, plan, subscription }: ConfigProps): PlanConfig => {
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
                icon: IcStorage,
                text: c('Subscription reminder').t`${planMaxSpace} storage per user`,
            },
            {
                icon: IcEnvelopes,
                text: c('Subscription reminder').ngettext(
                    msgid`${planNumberOfEmails} email address per user`,
                    `${planNumberOfEmails} email addresses per user`,
                    planNumberOfEmails
                ),
            },
            {
                icon: IcFolders,
                text: c('Subscription reminder').t`Folders, labels, and custom filters`,
            },
            {
                icon: IcGlobe,
                text: c('Subscription reminder').ngettext(
                    msgid`${planNumberOfDomains} custom email domain`,
                    `${planNumberOfDomains} custom email domains`,
                    planNumberOfDomains
                ),
            },
            {
                icon: IcAt,
                text: c('Subscription reminder').t`Catch-all email address`,
            },
            {
                icon: IcTv,
                text: c('Subscription reminder').t`Desktop app and email client support (via IMAP)`,
            },
            {
                icon: IcEnvelopeArrowUpAndRight,
                text: c('Subscription reminder').t`Automatic email forwarding`,
            },
            {
                icon: IcCalendarGrid,
                text: c('Subscription reminder').ngettext(
                    msgid`${planNumberOfCalendars} calendar per user`,
                    `${planNumberOfCalendars} calendars per user`,
                    planNumberOfCalendars
                ),
            },
            {
                icon: IcShieldHalfFilled,
                text: c('Subscription reminder').t`${PROTON_SENTINEL_NAME} advanced account protection`,
            },
            getPrioritySupport(),
            {
                icon: IcAppSwitch,
                text: c('Subscription reminder')
                    .t`${CALENDAR_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, and ${VPN_SHORT_APP_NAME} with premium features`,
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
