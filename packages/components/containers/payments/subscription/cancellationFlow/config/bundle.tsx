import { c, msgid } from 'ttag';

import { IcAppSwitch } from '@proton/icons/icons/IcAppSwitch';
import { IcAt } from '@proton/icons/icons/IcAt';
import { IcEnvelopes } from '@proton/icons/icons/IcEnvelopes';
import { IcFolders } from '@proton/icons/icons/IcFolders';
import { IcGift } from '@proton/icons/icons/IcGift';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcShieldHalfFilled } from '@proton/icons/icons/IcShieldHalfFilled';
import { IcStorage } from '@proton/icons/icons/IcStorage';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { hasCancellablePlan } from '@proton/payments/core/subscription/helpers';
import {
    APPS,
    BRAND_NAME,
    CALENDAR_APP_NAME,
    CALENDAR_SHORT_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
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
} from './b2cCommonConfig';
import type { ConfigProps, UpsellPlans } from './types';

const upsellPlans: UpsellPlans = {
    [APPS.PROTONMAIL]: PLANS.MAIL,
};

export const getBundleConfig = ({ app, plan, subscription }: ConfigProps): PlanConfig => {
    const currentPlan = PLANS.BUNDLE;
    const planName = PLAN_NAMES[currentPlan];
    const planMaxSpace = humanSize({ bytes: plan.MaxSpace, unit: 'GB', fraction: 0 });
    const planNumberOfEmails = plan.MaxAddresses;
    const planNumberOfDomains = plan.MaxDomains;

    const reminder = getDefaultReminder(planName);
    const testimonials: PlanConfigTestimonial = getDefaultTestimonial();

    const features: PlanConfigFeatures = {
        title: c('Subscription reminder').t`Comprehensive privacy and security`,
        description: c('Subscription reminder')
            .t`${planName} gives you access to all premium features from ${BRAND_NAME} ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}. Privacy is built-in so you can get on with it, knowing your data and identity are safe.`,
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
        upsellPlan: app && upsellPlans[app],
    };
};
