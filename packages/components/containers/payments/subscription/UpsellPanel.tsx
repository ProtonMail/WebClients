import { ReactNode } from 'react';

import { format, fromUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import {
    APPS,
    APP_NAMES,
    BRAND_NAME,
    CALENDAR_APP_NAME,
    CYCLE,
    MAIL_APP_NAME,
    PLANS,
    VPN_CONNECTIONS,
} from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import {
    getHasLegacyPlans,
    hasDrive,
    hasMail,
    hasMailPro,
    hasPassPlus,
    hasVPN,
    isTrial,
} from '@proton/shared/lib/helpers/subscription';
import { dateLocale } from '@proton/shared/lib/i18n';
import { Currency, Plan, Subscription, UserModel } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import { Icon, Price, StripedItem, StripedList } from '../../../components';
import { PlanCardFeatureDefinition } from '../features/interface';
import { getDrivePlan, getPassPlan } from '../features/plan';
import { OpenSubscriptionModalCallback } from './SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from './constants';

import './UpsellPanel.scss';

interface Item extends Omit<PlanCardFeatureDefinition, 'status' | 'highlight' | 'included'> {
    status?: PlanCardFeatureDefinition['status'];
    included?: PlanCardFeatureDefinition['included'];
}

interface UpsellBoxProps {
    title: string;
    children?: ReactNode;
    items: Item[];
    actions: ReactNode;
    description?: ReactNode;
}

const UpsellBox = ({ title, items, children, actions, description }: UpsellBoxProps) => {
    return (
        <div className="border border-primary rounded px-6 py-5 upsell-box flex-align-self-start on-tablet-order-1 on-mobile-order-1">
            <h3 className="mb-2">
                <strong>{title}</strong>
            </h3>
            {children}
            {description && <div className="color-weak text-lg">{description}</div>}
            <StripedList alternate="odd">
                {items.map(({ icon = 'checkmark', text, tooltip, included = true, status = 'available' }) => {
                    if (!included) {
                        return null;
                    }

                    const key = typeof text === 'string' ? text : `${tooltip}-${icon}-${included}-${status}`;

                    return (
                        <StripedItem
                            key={key}
                            className={clsx(status === 'coming-soon' && 'color-weak')}
                            left={<Icon className={clsx(included && 'color-success')} size={20} name={icon} />}
                            tooltip={tooltip}
                        >
                            {text}
                        </StripedItem>
                    );
                })}
            </StripedList>
            {actions}
        </div>
    );
};

interface Props {
    app: APP_NAMES;
    currency: Currency;
    subscription?: Subscription;
    plans: Plan[];
    user: UserModel;
    openSubscriptionModal: OpenSubscriptionModalCallback;
}

const getHighSpeedVPN = (connections: number) => {
    return c('new_plans: attribute').ngettext(
        msgid`Get ${connections} high-speed VPN connection`,
        `Get ${connections} high-speed VPN connections`,
        connections
    );
};

const getHighSpeedVPNB2B = (connections: number) => {
    return c('new_plans: attribute').ngettext(
        msgid`Get ${connections} high-speed VPN connection per user`,
        `Get ${connections} high-speed VPN connections per user`,
        connections
    );
};

const getUpgradeText = (planName: string) => {
    return c('new_plans: Title').t`Upgrade to ${planName}`;
};

const UpsellPanel = ({ currency, subscription, plans, user, openSubscriptionModal, app }: Props) => {
    if (!user.canPay || !subscription) {
        return null;
    }

    if (getHasLegacyPlans(subscription)) {
        return null;
    }

    const mailPlan = plans.find(({ Name }) => Name === PLANS.MAIL);
    // Trial upsell
    if (isTrial(subscription) && subscription.PeriodEnd && mailPlan) {
        const mailPlanName = mailPlan.Title;
        const formattedTrialExpirationDate = format(fromUnixTime(subscription.PeriodEnd || 0), 'PPP', {
            locale: dateLocale,
        });
        const handleUpgrade = () =>
            openSubscriptionModal({
                plan: PLANS.MAIL,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
            });
        const handleExplorePlans = () =>
            openSubscriptionModal({
                step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            });
        const storageSize = humanSize(15 * 1024 ** 3, undefined, undefined, 0);
        const items: Item[] = [
            {
                icon: 'storage',
                text: c('new_plans: Upsell attribute').t`${storageSize} total storage`,
            },
            {
                icon: 'envelope',
                text: c('new_plans: Upsell attribute').t`10 email addresses/aliases`,
            },
            {
                icon: 'tag',
                text: c('new_plans: Upsell attribute').t`Unlimited folders, labels, and filters`,
            },
            {
                icon: 'speech-bubble',
                text: c('new_plans: Upsell attribute').t`Unlimited messages`,
            },
            {
                icon: 'globe',
                text: c('new_plans: Upsell attribute').t`Support for 1 custom email domain`,
            },
            {
                icon: 'life-ring',
                text: c('new_plans: Upsell attribute').t`Priority support`,
            },
            {
                icon: 'brand-proton-calendar',
                text: CALENDAR_APP_NAME,
            },
        ];
        return (
            <UpsellBox
                title={c('new_plans: Title').t`${mailPlanName} Trial`}
                items={items}
                actions={
                    <>
                        <Button onClick={handleUpgrade} size="large" color="norm" shape="solid" fullWidth>
                            {c('new_plans: Action').t`Upgrade now`}
                        </Button>
                        <Button
                            onClick={handleExplorePlans}
                            size="large"
                            color="norm"
                            shape="ghost"
                            className="mt-2"
                            fullWidth
                        >
                            {c('new_plans: Action').t`Explore all ${BRAND_NAME} plans`}
                        </Button>
                    </>
                }
            >
                <h4>{c('new_plans: Info').t`Your trial ends ${formattedTrialExpirationDate}`}</h4>
                <div className="color-weak">
                    {c('new_plans: Info')
                        .t`To continue to use ${MAIL_APP_NAME} with premium features, choose your subscription and payment options.`}
                    <br />
                    <br />
                    {c('new_plans: Info')
                        .t`Otherwise access to your account will be limited, and your account will eventually be disabled.`}
                </div>
            </UpsellBox>
        );
    }

    const cycle = CYCLE.TWO_YEARS;

    const drivePlan = plans.find(({ Name }) => Name === PLANS.DRIVE);
    // Drive upsell
    if (user.isFree && app === APPS.PROTONDRIVE && drivePlan) {
        const plan = drivePlan;
        const items = getDrivePlan(plan).features;

        const price = (
            <Price key="plan-price" currency={currency} suffix={c('new_plans: Plan frequency').t`/month`}>
                {(plan.Pricing[cycle] || 0) / cycle}
            </Price>
        );
        const handleUpgrade = () =>
            openSubscriptionModal({
                cycle,
                plan: PLANS.DRIVE,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
            });

        return (
            <UpsellBox
                title={getUpgradeText(plan.Title)}
                description={c('new_plans: Info')
                    .t`Make privacy your default for file backup, storage, sharing, and retrieval.`}
                items={items.filter(isTruthy)}
                actions={
                    <Button onClick={handleUpgrade} size="large" color="norm" shape="solid" fullWidth>
                        {c('new_plans: Action').jt`From ${price}`}
                    </Button>
                }
            />
        );
    }

    const passPlan = plans.find(({ Name }) => Name === PLANS.PASS_PLUS);
    // Pass upsell
    if (user.isFree && app === APPS.PROTONPASS && passPlan) {
        const plan = passPlan;
        const { features, description } = getPassPlan(plan);

        const price = (
            <Price key="plan-price" currency={currency} suffix={c('new_plans: Plan frequency').t`/month`}>
                {(plan.Pricing[cycle] || 0) / cycle}
            </Price>
        );
        const handleUpgrade = () =>
            openSubscriptionModal({
                cycle,
                plan: PLANS.PASS_PLUS,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
            });

        return (
            <UpsellBox
                title={getUpgradeText(plan.Title)}
                description={description}
                items={features}
                actions={
                    <Button onClick={handleUpgrade} size="large" color="norm" shape="solid" fullWidth>
                        {c('new_plans: Action').jt`From ${price}`}
                    </Button>
                }
            />
        );
    }

    const passItems: Item[] = [
        {
            icon: 'pass-all-vaults',
            text: c('new_plans: Upsell attribute')
                .t`Secure your passwords and identity with an open-source and encrypted password manager.`,
        },
    ];

    const bundlePlan = plans.find(({ Name }) => Name === PLANS.BUNDLE);
    const bundleStorage = humanSize(bundlePlan?.MaxSpace ?? 500, undefined, undefined, 0);
    // Bundle upsell
    if (
        (user.isFree ||
            hasMail(subscription) ||
            hasDrive(subscription) ||
            hasPassPlus(subscription) ||
            hasVPN(subscription)) &&
        bundlePlan
    ) {
        const vpnPlan = plans.find(({ Name }) => Name === PLANS.VPN);
        const vpnPlanName = vpnPlan?.Title || '';
        const plan = bundlePlan;
        const price = (
            <Price key="plan-price" currency={currency} suffix={c('new_plans: Plan frequency').t`/month`}>
                {(plan.Pricing[cycle] || 0) / cycle}
            </Price>
        );
        const handleUpgrade = () =>
            openSubscriptionModal({
                cycle,
                plan: PLANS.BUNDLE,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
            });
        const items: (Item | undefined)[] = [
            {
                icon: 'storage',
                text: c('new_plans: Upsell attribute').t`Boost your storage space to ${bundleStorage} total`,
            },
            {
                icon: 'checkmark-circle',
                text: c('new_plans: Upsell attribute')
                    .t`Add more personalization with 15 email addresses and support for 3 custom email domains`,
            },
            !user.hasPaidMail
                ? {
                      icon: 'calendar-checkmark',
                      text: c('new_plans: Upsell attribute').ngettext(
                          msgid`Create up to ${MAX_CALENDARS_PAID} calendar`,
                          `Create up to ${MAX_CALENDARS_PAID} calendars`,
                          MAX_CALENDARS_PAID
                      ),
                  }
                : undefined,
            ...(hasVPN(subscription)
                ? ([
                      vpnPlanName
                          ? ({
                                icon: 'brand-proton-vpn',
                                text: c('new_plans: Upsell attribute').t`Everything in ${vpnPlanName}`,
                            } as const)
                          : undefined,
                  ] as const)
                : ([
                      {
                          icon: 'brand-proton-vpn',
                          text: getHighSpeedVPN(VPN_CONNECTIONS),
                      },
                      {
                          icon: 'checkmark-circle',
                          text: c('new_plans: Upsell attribute').t`Access advanced VPN features`,
                      },
                  ] as const)),
            ...passItems,
        ];
        return (
            <UpsellBox
                title={getUpgradeText(plan.Title)}
                description={c('new_plans: Info')
                    .t`Upgrade to the ultimate privacy pack and access all premium ${BRAND_NAME} services.`}
                items={items.filter(isTruthy)}
                actions={
                    <Button onClick={handleUpgrade} size="large" color="norm" shape="solid" fullWidth>
                        {c('new_plans: Action').jt`From ${price}`}
                    </Button>
                }
            />
        );
    }

    const businessPlan = plans.find(({ Name }) => Name === PLANS.BUNDLE_PRO);
    const businessStorage = humanSize(businessPlan?.MaxSpace ?? 500, undefined, undefined, 0);
    // Mail pro upsell
    if (hasMailPro(subscription) && businessPlan) {
        const plan = businessPlan;
        const price = (
            <Price key="plan-price" currency={currency} suffix={c('new_plans: Plan frequency').t`/month`}>
                {(plan.Pricing[cycle] || 0) / cycle}
            </Price>
        );
        const handleUpgrade = () =>
            openSubscriptionModal({
                cycle,
                plan: PLANS.BUNDLE_PRO,
                step: SUBSCRIPTION_STEPS.CUSTOMIZATION,
                disablePlanSelection: true,
            });
        const items: Item[] = [
            {
                icon: 'storage',
                text: c('new_plans: Upsell attribute').t`Boost your storage space to ${businessStorage} per user`,
            },
            {
                icon: 'envelope',
                text: c('new_plans: Upsell attribute').t`Get 5 additional email addresses per user`,
            },
            {
                icon: 'globe',
                text: c('new_plans: Upsell attribute').t`Cover more ground with support for 10 custom email domains`,
            },
            {
                icon: 'brand-proton-vpn',
                text: getHighSpeedVPNB2B(VPN_CONNECTIONS),
            },
            {
                icon: 'checkmark-circle',
                text: c('new_plans: Upsell attribute').t`Access advanced VPN features`,
            },
            ...passItems,
        ];
        return (
            <UpsellBox
                title={getUpgradeText(plan.Title)}
                description={c('new_plans: Info')
                    .t`Upgrade to the business pack with access to all premium ${BRAND_NAME} services.`}
                items={items}
                actions={
                    <Button onClick={handleUpgrade} size="large" color="norm" shape="solid" fullWidth>
                        {c('new_plans: Action').jt`From ${price} per user`}
                    </Button>
                }
            />
        );
    }

    return null;
};

export default UpsellPanel;
