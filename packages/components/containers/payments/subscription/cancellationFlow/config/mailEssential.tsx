import { c, msgid } from 'ttag';

import { IcAt } from '@proton/icons/icons/IcAt';
import { IcCalendarCheckmark } from '@proton/icons/icons/IcCalendarCheckmark';
import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';
import { IcEnvelopeArrowUpAndRight } from '@proton/icons/icons/IcEnvelopeArrowUpAndRight';
import { IcEnvelopes } from '@proton/icons/icons/IcEnvelopes';
import { IcFolders } from '@proton/icons/icons/IcFolders';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcStorage } from '@proton/icons/icons/IcStorage';
import { IcTv } from '@proton/icons/icons/IcTv';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { hasCancellablePlan } from '@proton/payments/core/subscription/helpers';
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
import type { ConfigProps } from './types';

export const getMailEssentialConfig = ({ plan, subscription }: ConfigProps): PlanConfig => {
    const currentPlan = PLANS.MAIL_PRO;
    const planName = PLAN_NAMES[currentPlan];
    const planMaxSpace = humanSize({ bytes: plan.MaxSpace, unit: 'GB', fraction: 0 });
    const planNumberOfEmails = plan.MaxAddresses;
    const planNumberOfDomains = plan.MaxDomains;
    const planNumberOfCalendars = plan.MaxCalendars;

    const reminder = getDefaultReminder(planName);
    const testimonials: PlanConfigTestimonial = getDefaultTestimonial(planName);

    const features: PlanConfigFeatures = {
        title: c('Subscription reminder').t`Email productivity features`,
        description: c('Subscription reminder')
            .t`${planName} gives your team what they need to be more productive, organized, and in control of their inbox, schedule, and more.`,
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
                icon: IcCalendarCheckmark,
                text: c('Subscription reminder').t`See your colleagues’ availability`,
            },
            {
                icon: IcAt,
                text: c('Subscription reminder').t`Catch-all email address`,
            },
            {
                icon: IcTv,
                text: c('Subscription reminder').t`Desktop app and email client support (via IMAP)`,
            },
            getPrioritySupport(),
        ],
    };

    const cancellablePlan = hasCancellablePlan(subscription);
    const storage: PlanConfigStorage = getDefaultGBStorageWarning(planName, planMaxSpace, cancellablePlan);
    const confirmationModal: ConfirmationModal = getDefaultConfirmationModal(subscription, planName, cancellablePlan);

    return {
        confirmationModal,
        features,
        plan: currentPlan,
        planName,
        reminder,
        storage,
        testimonials,
    };
};
