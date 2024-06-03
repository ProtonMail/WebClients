import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import {
    BRAND_NAME,
    CALENDAR_APP_NAME,
    DRIVE_APP_NAME,
    MAIL_APP_NAME,
    PASS_APP_NAME,
    PLANS,
    PLAN_NAMES,
    PROTON_SENTINEL_NAME,
    VPN_APP_NAME,
} from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { SubscriptionModel, SubscriptionPlan } from '@proton/shared/lib/interfaces';

import {
    ConfirmationModal,
    PlanConfig,
    PlanConfigFeatures,
    PlanConfigStorage,
    PlanConfigTestimonial,
} from '../interface';
import {
    ExpirationTime,
    getDefaultConfirmationModal,
    getDefaultReminder,
    getDefaultTBStorageWarning,
    getDefaultTestimonial,
} from './commonConfig';

export const getVisionaryConfig = (
    subscription: SubscriptionModel,
    plan: SubscriptionPlan & { Name: PLANS },
    vpnCountries: number,
    newCancellationPolicy?: boolean
): PlanConfig => {
    const planName = PLAN_NAMES[PLANS.NEW_VISIONARY];
    const planMaxSpace = humanSize({ bytes: plan.MaxSpace, unit: 'TB', fraction: 0 });

    const reminder = getDefaultReminder(planName);
    const testimonials: PlanConfigTestimonial = getDefaultTestimonial();

    const features: PlanConfigFeatures = {
        title: c('Subscription reminder').t`The best of ${BRAND_NAME}`,
        description: c('Subscription reminder')
            .t`${planName} gives you all apps, all features, early access to new releases, and everything you need to be in control of your data and its security.`,
        features: [
            {
                icon: 'storage',
                text: c('Subscription reminder').t`${planMaxSpace} total storage`,
            },
            {
                icon: 'users',
                text: c('Subscription reminder').t`6 users`,
            },
            {
                icon: 'rocket',
                text: c('Subscription reminder').t`Early access to new apps and features`,
            },
            {
                icon: 'shield-half-filled',
                text: c('Subscription reminder').t`${PROTON_SENTINEL_NAME} program`,
            },
            {
                icon: 'brand-proton-mail',
                text: c('Subscription reminder').t`${MAIL_APP_NAME} and all premium productivity features`,
            },
            {
                icon: 'brand-proton-calendar',
                text: c('Subscription reminder').t`${CALENDAR_APP_NAME} including calendar sharing`,
            },
            {
                icon: 'brand-proton-drive',
                text: c('Subscription reminder').t`${DRIVE_APP_NAME} including version history`,
            },
            {
                icon: 'brand-proton-pass',
                text: c('Subscription reminder').t`${PASS_APP_NAME} including unlimited hide-my-email aliases`,
            },
            {
                icon: 'brand-proton-vpn',
                text: c('Subscription reminder')
                    .t`${VPN_APP_NAME} with access to all high-speed servers in ${vpnCountries} countries`,
            },
        ],
    };

    const storage: PlanConfigStorage = getDefaultTBStorageWarning(planName, planMaxSpace, newCancellationPolicy);

    const expiryDate = <ExpirationTime subscription={subscription} newCancellationPolicy={newCancellationPolicy} />;
    const learnMoreLink = (
        <Href className="mb-8" href={getKnowledgeBaseUrl('/free-plan-limits')}>
            {c('Link').t`Learn more`}
        </Href>
    );

    const unavailablePlan = (
        <p>{c('Subscription reminder')
            .t`Please note that ${planName} is no longer available for purchase. If you downgrade your account, you will lose all plan benefits and won't be able to resubscribe.`}</p>
    );

    const config = getDefaultConfirmationModal(subscription, planName, newCancellationPolicy);
    //Your Proton Visionary subscription ends on June 6, 2024.  Learn more
    const description = newCancellationPolicy
        ? c('Subscription reminder')
              .jt`Your ${planName} subscription ends on ${expiryDate}. After that, you’ll be on the ${BRAND_NAME} Free plan. If your usage exceeds free plan limits, you may experience restricted access to product features and your data. ${learnMoreLink} ${unavailablePlan}`
        : c('Subscription reminder')
              .jt`You still have ${expiryDate} left on your ${planName} subscription. We'll add the credits for the remaining time to your ${BRAND_NAME} Account. Make sure you do not exceed the free plan limits before canceling. ${learnMoreLink} ${unavailablePlan}`;

    const confirmationModal: ConfirmationModal = {
        ...config,
        description,
    };

    return {
        planName,
        plan: PLANS.NEW_VISIONARY,
        reminder,
        testimonials,
        features,
        storage,
        confirmationModal,
        keepPlanCTA: c('Subscription reminder').t`Keep ${planName}`,
    };
};
