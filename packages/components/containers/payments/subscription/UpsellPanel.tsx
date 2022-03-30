import { c, msgid } from 'ttag';
import { format } from 'date-fns';
import {
    CYCLE,
    DEFAULT_CURRENCY,
    PLANS,
    PLAN_NAMES,
    APPS,
    BRAND_NAME,
    VPN_CONNECTIONS,
} from '@proton/shared/lib/constants';
import {
    hasMailPro,
    hasMail,
    hasDrive,
    hasVPN,
    isTrial,
    getHasLegacyPlans,
} from '@proton/shared/lib/helpers/subscription';
import { Plan, Subscription, UserModel, VPNCountries, VPNServers } from '@proton/shared/lib/interfaces';
import { getAppName } from '@proton/shared/lib/apps/helper';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { getVpnConnections } from '@proton/shared/lib/vpn/features';

import { getPlusServers } from '@proton/shared/lib/vpn/features';
import { StrippedList, StrippedItem, Button, Price } from '../../../components';
import { useConfig } from '../../../hooks';
import { OpenSubscriptionModalCallback } from './SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from './constants';

interface Props {
    subscription?: Subscription;
    plans: Plan[];
    vpnCountries?: VPNCountries;
    vpnServers?: VPNServers;
    user: UserModel;
    openSubscriptionModal: OpenSubscriptionModalCallback;
}

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
    if (isTrial(subscription)) {
        const mailPlanName = PLAN_NAMES[PLANS.MAIL];
        const formattedTrialExpirationDate = format(subscription.PeriodEnd, 'MMMM d, y');
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
        return (
            <div className="border rounded px2 py1-5 pt0-5">
                <h3>
                    <strong>{c('new_plans: Title').t`${mailPlanName} Trial`}</strong>
                </h3>
                <h4>{c('new_plans: Info').t`Your trial ends ${formattedTrialExpirationDate}`}</h4>
                <p className="color-weak">{c('new_plans: Info')
                    .t`To continue to use Proton Mail with premium features, choose your subscription and payment options.`}</p>
                <p className="color-weak">{c('new_plans: Info')
                    .t`Otherwise access to your account will be limited, and your account will eventually be disabled.`}</p>
                <StrippedList>
                    {[
                        {
                            icon: 'check',
                            text: c('new_plans: Upsell attribute').t`15 GB total storage`,
                        },
                        {
                            icon: 'check',
                            text: c('new_plans: Upsell attribute').t`10 email addresses/aliases`,
                        },
                        {
                            icon: 'check',
                            text: c('new_plans: Upsell attribute').t`Unlimited folders, labels, and filters`,
                        },
                        {
                            icon: 'check',
                            text: c('new_plans: Upsell attribute').t`Unlimited messages`,
                        },
                        {
                            icon: 'check',
                            text: c('new_plans: Upsell attribute').t`Support for 1 custom email`,
                        },
                        {
                            icon: 'check',
                            text: c('new_plans: Upsell attribute').t`Priority support`,
                        },
                        {
                            icon: 'check',
                            text: calendarAppName,
                        },
                    ].map((item) => {
                        return (
                            <StrippedItem key={item.text} icon={item.icon}>
                                {item.text}
                            </StrippedItem>
                        );
                    })}
                </StrippedList>
                <Button onClick={handleUpgrade} size="large" color="norm" shape="solid" fullWidth>{c(
                    'new_plans: Action'
                ).t`Upgrade now`}</Button>
                <Button onClick={handleExplorePlans} size="large" color="norm" shape="ghost" fullWidth>{c(
                    'new_plans: Action'
                ).t`Explore all ${BRAND_NAME} plans`}</Button>
            </div>
        );
    }

    const cycle = CYCLE.TWO_YEARS;

    const vpnPlanName = PLAN_NAMES[PLANS.VPN];
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
        return (
            <div className="border rounded px2 py1-5 pt0-5">
                <h3>
                    <strong>{c('new_plans: Title').t`Upgrade to ${vpnPlanName}`}</strong>
                </h3>
                <p>{c('new_plans: Info')
                    .t`The dedicated VPN solution that provides secure, unrestricted, high-speed access to the internet.`}</p>
                <StrippedList>
                    {[
                        {
                            icon: 'check',
                            text: c('new_plans: attribute').ngettext(
                                msgid`High-speed VPN on ${maxVpn} device`,
                                `High-speed VPN on ${maxVpn} devices`,
                                maxVpn
                            ),
                        },
                        {
                            icon: 'check',
                            text: c('new_plans: attribute').t`Built-in ad blocker (NetShield)`,
                        },
                        {
                            icon: 'check',
                            text: c('new_plans: attribute').t`Access to streaming services globally`,
                        },
                        {
                            icon: 'check',
                            text: getPlusServers(vpnServers?.[PLANS.VPNPLUS], vpnCountries?.[PLANS.VPNPLUS].count),
                        },
                    ].map((item) => {
                        return <StrippedItem icon={item.icon}>{item.text}</StrippedItem>;
                    })}
                </StrippedList>
                <Button onClick={handleUpgrade} size="large" color="norm" shape="solid" fullWidth>{c(
                    'new_plans: Action'
                ).jt`From ${price}`}</Button>
            </div>
        );
    }

    const bundlePlanName = PLAN_NAMES[PLANS.BUNDLE];
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
        return (
            <div className="border rounded px2 py1-5 pt0-5">
                <h3>
                    <strong>{c('new_plans: Title').t`Upgrade to ${bundlePlanName}`}</strong>
                </h3>
                <p className="color-weak">{c('new_plans: Info')
                    .t`Upgrade to the ultimate privacy pack and access all premium Proton services.`}</p>
                <StrippedList>
                    {[
                        {
                            icon: 'check',
                            text: c('new_plans: Upsell attribute')
                                .t`Boost your storage space to ${bundleStorage} total`,
                        },
                        {
                            icon: 'check',
                            text: c('new_plans: attribute').ngettext(
                                msgid`Get ${VPN_CONNECTIONS} high-speed VPN connection`,
                                `Get ${VPN_CONNECTIONS} high-speed VPN connections`,
                                VPN_CONNECTIONS
                            ),
                        },
                        {
                            icon: 'check',
                            text: c('new_plans: Upsell attribute').t`Access advanced VPN features`,
                        },
                        {
                            icon: 'check',
                            text: c('new_plans: Upsell attribute')
                                .t`Add more personalization with 15 email addresses and support for 3 custom email domains`,
                        },
                        {
                            icon: 'check',
                            text: c('new_plans: Upsell attribute').t`Create up to 20 personal calendars`,
                        },
                    ].map((item) => {
                        return (
                            <StrippedItem key={item.text} icon={item.icon}>
                                {item.text}
                            </StrippedItem>
                        );
                    })}
                </StrippedList>
                <Button onClick={handleUpgrade} size="large" color="norm" shape="solid" fullWidth>{c(
                    'new_plans: Action'
                ).jt`From ${price}`}</Button>
            </div>
        );
    }

    const businessPlanName = PLAN_NAMES[PLANS.BUNDLE_PRO];
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
        return (
            <div className="border rounded px2 py1-5 pt0-5">
                <h3>
                    <strong>{c('new_plans: Title').t`Upgrade to ${businessPlanName}`}</strong>
                </h3>
                <p className="color-weak">{c('new_plans: Info')
                    .t`The ultimate privacy pack with access to all premium Proton services.`}</p>
                <StrippedList>
                    {[
                        {
                            icon: 'check',
                            text: getVpnConnections(VPN_CONNECTIONS),
                        },
                        {
                            icon: 'check',
                            text: c('new_plans: Upsell attribute').t`Advanced VPN features`,
                        },
                        {
                            icon: 'check',
                            text: c('new_plans: Upsell attribute')
                                .t`${businessStorage} storage for email and file storage`,
                        },
                        {
                            icon: 'check',
                            text: c('new_plans: Upsell attribute').t`15 Proton email addresses`,
                        },
                        {
                            icon: 'check',
                            text: c('new_plans: Upsell attribute').t`Support for 3 custom email domains`,
                        },
                        {
                            icon: 'check',
                            text: c('new_plans: Upsell attribute').t`Up to 20 personal calendars`,
                        },
                        {
                            icon: 'check',
                            text: c('new_plans: Upsell attribute').t`Links to share calendars, files, and folders`,
                        },
                    ].map((item) => {
                        return (
                            <StrippedItem key={item.text} icon={item.icon}>
                                {item.text}
                            </StrippedItem>
                        );
                    })}
                </StrippedList>
                <Button onClick={handleUpgrade} size="large" color="norm" shape="solid" fullWidth>{c(
                    'new_plans: Action'
                ).jt`From ${price} per user`}</Button>
            </div>
        );
    }

    return null;
};

export default UpsellPanel;
