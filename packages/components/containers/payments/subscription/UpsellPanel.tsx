import { ReactNode } from 'react';
import { c, msgid } from 'ttag';
import { format, fromUnixTime } from 'date-fns';
import {
    CYCLE,
    DEFAULT_CURRENCY,
    PLANS,
    APPS,
    BRAND_NAME,
    VPN_CONNECTIONS,
    MAIL_APP_NAME,
} from '@proton/shared/lib/constants';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import {
    hasMailPro,
    hasMail,
    hasDrive,
    hasVPN,
    isTrial,
    getHasLegacyPlans,
} from '@proton/shared/lib/helpers/subscription';
import { Plan, Subscription, UserModel, VPNCountries, VPNServers } from '@proton/shared/lib/interfaces';
import { MAX_CALENDARS_PER_USER } from '@proton/shared/lib/calendar/constants';
import { getAppName } from '@proton/shared/lib/apps/helper';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { getPlusServers } from '@proton/shared/lib/vpn/features';
import { StripedList, StripedItem, Button, Price, IconName, Icon } from '../../../components';
import { useConfig } from '../../../hooks';
import { OpenSubscriptionModalCallback } from './SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from './constants';
import './UpsellPanel.scss';

interface UpsellBoxProps {
    title: string;
    children?: ReactNode;
    items: Item[];
    actions: ReactNode;
    description?: ReactNode;
}

const UpsellBox = ({ title, items, children, actions, description }: UpsellBoxProps) => {
    return (
        <div className="border border-primary rounded px2 py1-5 pt0-5 upsell-box">
            <h3>
                <strong>{title}</strong>
            </h3>
            {children}
            {description && <div className="color-weak text-lg">{description}</div>}
            <StripedList>
                {items.map((item) => {
                    return (
                        <StripedItem key={item.text} left={<Icon className="color-warning" name="fire" size={20} />}>
                            {item.text}
                        </StripedItem>
                    );
                })}
            </StripedList>
            {actions}
        </div>
    );
};

interface Item {
    icon: IconName;
    text: string;
}

interface Props {
    subscription?: Subscription;
    plans: Plan[];
    vpnCountries?: VPNCountries;
    vpnServers?: VPNServers;
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

const UpsellPanel = ({ subscription, plans, vpnServers, vpnCountries, user, openSubscriptionModal }: Props) => {
    const { APP_NAME } = useConfig();
    const isVpnApp = APP_NAME === APPS.PROTONVPN_SETTINGS;

    if (!user.canPay || !subscription) {
        return null;
    }

    if (getHasLegacyPlans(subscription)) {
        return null;
    }

    // Trial upsell
    const mailPlan = plans.find(({ Name }) => Name === PLANS.MAIL);
    if (isTrial(subscription) && subscription.PeriodEnd && mailPlan) {
        const mailPlanName = mailPlan.Title;
        const formattedTrialExpirationDate = format(fromUnixTime(subscription.PeriodEnd || 0), 'MMMM d, y');
        const calendarAppName = getAppName(APPS.PROTONCALENDAR);
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
                text: calendarAppName,
            },
        ];
        return (
            <UpsellBox
                title={c('new_plans: Title').t`${mailPlanName} Trial`}
                items={items}
                actions={
                    <>
                        <Button onClick={handleUpgrade} size="large" color="norm" shape="solid" fullWidth>{c(
                            'new_plans: Action'
                        ).t`Upgrade now`}</Button>
                        <Button
                            onClick={handleExplorePlans}
                            size="large"
                            color="norm"
                            shape="ghost"
                            className="mt0-5"
                            fullWidth
                        >{c('new_plans: Action').t`Explore all ${BRAND_NAME} plans`}</Button>
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

    const vpnPlan = plans.find(({ Name }) => Name === PLANS.VPN);
    // VPN app only upsell
    if (user.isFree && isVpnApp && vpnPlan) {
        const plan = vpnPlan;
        const price = (
            <Price key="plan-price" currency={DEFAULT_CURRENCY} suffix={c('new_plans: Plan frequency').t`/month`}>
                {(plan.Pricing[cycle] || 0) / cycle}
            </Price>
        );
        const handleUpgrade = () =>
            openSubscriptionModal({
                cycle,
                plan: PLANS.VPN,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
            });
        const maxVpn = 10;
        const items: Item[] = [
            {
                icon: 'brand-proton-vpn',
                text: c('new_plans: attribute').ngettext(
                    msgid`High-speed VPN on ${maxVpn} device`,
                    `High-speed VPN on ${maxVpn} devices`,
                    maxVpn
                ),
            },
            {
                icon: 'shield',
                text: c('new_plans: attribute').t`Built-in ad blocker (NetShield)`,
            },
            {
                icon: 'play',
                text: c('new_plans: attribute').t`Access to streaming services globally`,
            },
            {
                icon: 'earth',
                text: getPlusServers(vpnServers?.[PLANS.VPN], vpnCountries?.[PLANS.VPN].count),
            },
        ];
        return (
            <UpsellBox
                title={getUpgradeText(plan.Title)}
                description={c('new_plans: Info')
                    .t`The dedicated VPN solution that provides secure, unrestricted, high-speed access to the internet.`}
                items={items}
                actions={
                    <Button onClick={handleUpgrade} size="large" color="norm" shape="solid" fullWidth>
                        {c('new_plans: Action').jt`From ${price}`}
                    </Button>
                }
            />
        );
    }

    const bundlePlan = plans.find(({ Name }) => Name === PLANS.BUNDLE);
    const bundleStorage = humanSize(bundlePlan?.MaxSpace ?? 500, undefined, undefined, 0);
    // Bundle upsell
    if ((user.isFree || hasMail(subscription) || hasDrive(subscription) || hasVPN(subscription)) && bundlePlan) {
        const plan = bundlePlan;
        const price = (
            <Price
                key="plan-price"
                currency={subscription?.Currency || DEFAULT_CURRENCY}
                suffix={c('new_plans: Plan frequency').t`/month`}
            >
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
        const numberOfPersonalCalendars = MAX_CALENDARS_PER_USER;
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
            !hasMail(subscription)
                ? {
                      icon: 'calendar-checkmark',
                      text: c('new_plans: Upsell attribute').ngettext(
                          msgid`Create up to ${numberOfPersonalCalendars} personal calendar`,
                          `Create up to ${numberOfPersonalCalendars} personal calendars`,
                          numberOfPersonalCalendars
                      ),
                  }
                : undefined,
            {
                icon: 'brand-proton-vpn',
                text: getHighSpeedVPN(VPN_CONNECTIONS),
            },
            {
                icon: 'checkmark-circle',
                text: c('new_plans: Upsell attribute').t`Access advanced VPN features`,
            },
        ];
        return (
            <UpsellBox
                title={getUpgradeText(plan.Title)}
                description={c('new_plans: Info')
                    .t`Upgrade to the ultimate privacy pack and access all premium Proton services.`}
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
            <Price
                key="plan-price"
                currency={subscription?.Currency || DEFAULT_CURRENCY}
                suffix={c('new_plans: Plan frequency').t`/month`}
            >
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
        ];
        return (
            <UpsellBox
                title={getUpgradeText(plan.Title)}
                description={c('new_plans: Info')
                    .t`Upgrade to the business pack with access to all premium Proton services.`}
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
