import { differenceInDays, format, fromUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

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
import { getDefaultConfirmationModal, getDefaultTBStorageWarning, getDefaultTestimonial } from './commonConfig';

export const getVisionaryConfig = (
    subscription: SubscriptionModel,
    plan: SubscriptionPlan & { Name: PLANS },
    vpnCountries: number
): PlanConfig => {
    const planName = PLAN_NAMES[PLANS.NEW_VISIONARY];
    const planMaxSpace = humanSize({ bytes: plan.MaxSpace, unit: 'TB', fraction: 0 });

    const reminder = {
        title: c('Subscription reminder').t`What you give up when you cancel ${planName}`,
    };

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

    const storage: PlanConfigStorage = getDefaultTBStorageWarning(planName, planMaxSpace);

    const latestSubscription = subscription.UpcomingSubscription?.PeriodEnd ?? subscription.PeriodEnd;
    const endSubDate = fromUnixTime(latestSubscription);
    const dayDiff = differenceInDays(endSubDate, new Date());
    const expiryDate = (
        <strong>
            <time dateTime={format(endSubDate, 'yyyy-MM-dd')}>
                {c('Subscription reminder').ngettext(msgid`${dayDiff} day left`, `${dayDiff} days left`, dayDiff)}
            </time>
        </strong>
    );

    const learnMoreLink = (
        <Href className="mb-8" href={getKnowledgeBaseUrl('/free-plan-limits')}>
            {c('Link').t`Learn more`}
        </Href>
    );

    const unavailablePlan = (
        <p>{c('Subscription reminder')
            .t`Please note that ${planName} is no longer available for purchase. If you downgrade your account, you will lose all plan benefits and won't be able to resubscribe.`}</p>
    );

    const config = getDefaultConfirmationModal(subscription, planName);
    const description = c('Subscription reminder')
        .jt`You still have ${expiryDate} left on your ${planName} subscription. We'll add the credits for the remaining time to your ${BRAND_NAME} Account. Make sure you do not exceed the free plan limits before canceling. ${learnMoreLink} ${unavailablePlan}`;

    const confirmationModal: ConfirmationModal = {
        ...config,
        description,
    };

    return {
        plan: PLANS.NEW_VISIONARY,
        reminder,
        testimonials,
        features,
        storage,
        confirmationModal,
        keepPlanCTA: c('Subscription reminder').t`Keep ${planName}`,
        keepPlanCTAIcon: 'upgrade',
        redirectModal: c('Subscription reminder').t`Your ${planName} has been canceled.`,
    };
};
