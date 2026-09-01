import { c, msgid } from 'ttag';

import { IcAt } from '@proton/icons/icons/IcAt';
import { IcEnvelopes } from '@proton/icons/icons/IcEnvelopes';
import { IcFolders } from '@proton/icons/icons/IcFolders';
import { IcGift } from '@proton/icons/icons/IcGift';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcShield2Bolt } from '@proton/icons/icons/IcShield2Bolt';
import { IcStorage } from '@proton/icons/icons/IcStorage';
import { IcTv } from '@proton/icons/icons/IcTv';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { hasCancellablePlan } from '@proton/payments/core/subscription/helpers';
import { DARK_WEB_MONITORING_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
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
} from './b2cCommonConfig';
import type { ConfigProps } from './types';

export const getMailPlusConfig = ({ plan, subscription }: ConfigProps): PlanConfig => {
    const currentPlan = PLANS.MAIL;
    const planName = PLAN_NAMES[currentPlan];
    const planMaxSpace = humanSize({ bytes: plan.MaxSpace, unit: 'GB', fraction: 0 });
    const planNumberOfEmails = plan.MaxAddresses;
    const planNumberOfDomains = plan.MaxDomains;

    const reminder = getDefaultReminder(planName);
    const testimonials: PlanConfigTestimonial = getDefaultTestimonial();

    const features: PlanConfigFeatures = {
        title: c('Subscription reminder').t`Comprehensive privacy and security`,
        description: c('Subscription reminder')
            .t`${planName} goes beyond the basics to help you be more productive, organized, and in control of your inbox, email identity, and more.`,
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
                icon: IcShield2Bolt,
                text: DARK_WEB_MONITORING_NAME,
            },
            getPrioritySupport(),
            {
                icon: IcEnvelopes,
                text: c('Subscription reminder').ngettext(
                    msgid`${planNumberOfEmails} email address`,
                    `${planNumberOfEmails} email addresses`,
                    planNumberOfEmails
                ),
            },
            {
                icon: IcFolders,
                text: c('Subscription reminder').t`Folders, labels and filters`,
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
                text: c('Subscription reminder').t`Your own short @pm.me email alias`,
            },
            {
                icon: IcTv,
                text: c('Subscription reminder').t`${MAIL_APP_NAME} desktop app`,
            },
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
