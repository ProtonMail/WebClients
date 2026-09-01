import { c, msgid } from 'ttag';

import { IcAppSwitch } from '@proton/icons/icons/IcAppSwitch';
import { IcAt } from '@proton/icons/icons/IcAt';
import { IcEnvelopes } from '@proton/icons/icons/IcEnvelopes';
import { IcFolders } from '@proton/icons/icons/IcFolders';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcShieldHalfFilled } from '@proton/icons/icons/IcShieldHalfFilled';
import { IcStorage } from '@proton/icons/icons/IcStorage';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { hasCancellablePlan } from '@proton/payments/core/subscription/helpers';
import {
    APPS,
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
    getDefaultReminder,
    getDefaultTBStorageWarning,
    getDefaultTestimonial,
} from './b2cCommonConfig';
import type { ConfigProps, UpsellPlans } from './types';

export const getDuoConfig = ({ app, plan, subscription }: ConfigProps): PlanConfig => {
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
                icon: IcStorage,
                text: c('Subscription reminder').t`${planMaxSpace} total storage`,
            },
            {
                icon: IcUsers,
                text: c('Subscription reminder').t`2 users`,
            },
            {
                icon: IcShieldHalfFilled,
                text: c('Subscription reminder').t`${PROTON_SENTINEL_NAME} advanced account protection`,
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
                text: c('Subscription reminder').t`Your own short @pm.me email alias`,
            },
            {
                icon: IcAppSwitch,
                text: c('Subscription reminder')
                    .t`${CALENDAR_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, and ${VPN_SHORT_APP_NAME} with premium features`,
            },
        ],
    };

    const cancellablePlan = hasCancellablePlan(subscription);
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
