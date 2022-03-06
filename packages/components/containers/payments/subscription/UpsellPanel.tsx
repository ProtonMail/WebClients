import { c } from 'ttag';
import { format } from 'date-fns';
import { CYCLE, DEFAULT_CURRENCY, PLANS, PLAN_NAMES, APPS, DEFAULT_CYCLE } from '@proton/shared/lib/constants';
import {
    hasMailPro,
    hasMail,
    hasDrive,
    hasVPN,
    isTrial,
    getHasLegacyPlans,
} from '@proton/shared/lib/helpers/subscription';
import { Plan, Subscription, UserModel, VPNCountries } from '@proton/shared/lib/interfaces';
import { getAppName } from '@proton/shared/lib/apps/helper';

import { getPlusServers } from '@proton/shared/lib/vpn/features';
import { StrippedList, StrippedItem, Button, Price } from '../../../components';
import { useConfig } from '../../../hooks';
import { OpenSubscriptionModalCallback } from '.';
import { SUBSCRIPTION_STEPS } from './constants';

interface Props {
    subscription?: Subscription;
    plans: Plan[];
    vpnCountries: VPNCountries;
    user: UserModel;
    openSubscriptionModal: OpenSubscriptionModalCallback;
}

const UpsellPanel = ({ subscription, plans, vpnCountries, user, openSubscriptionModal }: Props) => {
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
                planIDs: { [PLANS.MAIL]: 1 },
                cycle: DEFAULT_CYCLE,
                currency: subscription?.Currency,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disableBackButton: true,
            });
        const handleExplorePlans = () =>
            openSubscriptionModal({
                cycle: DEFAULT_CYCLE,
                currency: subscription?.Currency,
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
                    <StrippedItem icon="check">{c('new_plans: Upsell attribute').t`15 GB total storage`}</StrippedItem>
                    <StrippedItem icon="check">{c('new_plans: Upsell attribute')
                        .t`10 email addresses/aliases`}</StrippedItem>
                    <StrippedItem icon="check">{c('new_plans: Upsell attribute')
                        .t`Unlimited folders, labels, and filters`}</StrippedItem>
                    <StrippedItem icon="check">{c('new_plans: Upsell attribute').t`Unlimited messages`}</StrippedItem>
                    <StrippedItem icon="check">{c('new_plans: Upsell attribute')
                        .t`Support for 1 custom email`}</StrippedItem>
                    <StrippedItem icon="check">{c('new_plans: Upsell attribute').t`Priority support`}</StrippedItem>
                    <StrippedItem icon="check">{calendarAppName}</StrippedItem>
                </StrippedList>
                <Button onClick={handleUpgrade} size="large" color="norm" shape="solid" fullWidth>{c(
                    'new_plans: Action'
                ).t`Upgrade now`}</Button>
                <Button onClick={handleExplorePlans} size="large" color="norm" shape="ghost" fullWidth>{c(
                    'new_plans: Action'
                ).t`Explore all Proton plans`}</Button>
            </div>
        );
    }

    // VPN app only upsell
    if (user.isFree && isVpnApp) {
        const numberOfPlusCountries = vpnCountries[PLANS.VPNPLUS].count;
        const vpn = PLAN_NAMES[PLANS.VPN];
        const plan = plans.find(({ Name }) => Name === PLANS.VPN) as Plan;
        const price = (
            <Price key="plan-price" currency={DEFAULT_CURRENCY} suffix={c('new_plans: Plan frequency').t`/month`}>
                {plan.Pricing[CYCLE.TWO_YEARS] / CYCLE.TWO_YEARS}
            </Price>
        );
        const handleUpgrade = () =>
            openSubscriptionModal({
                planIDs: { [PLANS.VPN]: 1 },
                cycle: DEFAULT_CYCLE,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disableBackButton: true,
            });
        return (
            <div className="border rounded px2 py1-5 pt0-5">
                <h3>
                    <strong>{c('new_plans: Title').t`Upgrade to ${vpn}`}</strong>
                </h3>
                <p>{c('new_plans: Info')
                    .t`The dedicated VPN solution that provides secure, unrestricted, high-speed access to the internet.`}</p>
                <StrippedList>
                    <StrippedItem icon="check">{c('new_plans: Upsell attribute')
                        .t`High speed VPN on 10 devices`}</StrippedItem>
                    <StrippedItem icon="check">{c('new_plans: Upsell attribute')
                        .t`Built-in ad blocker (NetShield)`}</StrippedItem>
                    <StrippedItem icon="check">{c('new_plans: Upsell attribute')
                        .t`Access to streaming services globally`}</StrippedItem>
                    <StrippedItem icon="check">{getPlusServers(numberOfPlusCountries)}</StrippedItem>
                </StrippedList>
                <Button onClick={handleUpgrade} size="large" color="norm" shape="solid" fullWidth>{c(
                    'new_plans: Action'
                ).jt`From ${price}`}</Button>
            </div>
        );
    }

    // Bundle upsell
    if (user.isFree || hasMail(subscription) || hasDrive(subscription) || hasVPN(subscription)) {
        const bundle = PLAN_NAMES[PLANS.BUNDLE];
        const plan = plans.find(({ Name }) => Name === PLANS.BUNDLE) as Plan;
        const price = (
            <Price
                key="plan-price"
                currency={subscription?.Currency || DEFAULT_CURRENCY}
                suffix={c('new_plans: Plan frequency').t`/month`}
            >
                {plan.Pricing[CYCLE.TWO_YEARS] / CYCLE.TWO_YEARS}
            </Price>
        );
        const handleUpgrade = () =>
            openSubscriptionModal({
                planIDs: { [PLANS.BUNDLE]: 1 },
                cycle: DEFAULT_CYCLE,
                currency: subscription?.Currency || DEFAULT_CURRENCY,
                step: SUBSCRIPTION_STEPS.CUSTOMIZATION,
                disableBackButton: true,
            });
        return (
            <div className="border rounded px2 py1-5 pt0-5">
                <h3>
                    <strong>{c('new_plans: Title').t`Upgrade to ${bundle}`}</strong>
                </h3>
                <p className="color-weak">{c('new_plans: Info')
                    .t`Upgrade to the ultimate privacy pack and access all premium Proton services.`}</p>
                <StrippedList>
                    <StrippedItem icon="check">{c('new_plans: Upsell attribute')
                        .t`Boost your storage space to 500 GB total`}</StrippedItem>
                    <StrippedItem icon="check">{c('new_plans: Upsell attribute')
                        .t`Get 10 high-speed VPN connections`}</StrippedItem>
                    <StrippedItem icon="check">{c('new_plans: Upsell attribute')
                        .t`Access advanced VPN features`}</StrippedItem>
                    <StrippedItem icon="check">{c('new_plans: Upsell attribute')
                        .t`Create up to 20 personal calendars`}</StrippedItem>
                    <StrippedItem icon="check">{c('new_plans: Upsell attribute')
                        .t`Add more personalization with 15 email addresses and support for 3 custom email domains`}</StrippedItem>
                </StrippedList>
                <Button onClick={handleUpgrade} size="large" color="norm" shape="solid" fullWidth>{c(
                    'new_plans: Action'
                ).jt`From ${price}`}</Button>
            </div>
        );
    }

    // Mail pro upsell
    if (hasMailPro(subscription)) {
        const business = PLAN_NAMES[PLANS.BUNDLE_PRO];
        const plan = plans.find(({ Name }) => Name === PLANS.BUNDLE_PRO) as Plan;
        const price = (
            <Price
                key="plan-price"
                currency={subscription?.Currency || DEFAULT_CURRENCY}
                suffix={c('new_plans: Plan frequency').t`/month`}
            >
                {plan.Pricing[CYCLE.TWO_YEARS] / CYCLE.TWO_YEARS}
            </Price>
        );
        const handleUpgrade = () =>
            openSubscriptionModal({
                planIDs: { [PLANS.BUNDLE_PRO]: 1 },
                cycle: DEFAULT_CYCLE,
                currency: subscription.Currency,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disableBackButton: true,
            });
        return (
            <div className="border rounded px2 py1-5 pt0-5">
                <h3>
                    <strong>{c('new_plans: Title').t`Upgrade to ${business}`}</strong>
                </h3>
                <p className="color-weak">{c('new_plans: Info')
                    .t`The ultimate privacy pack with access to all premium Proton services.`}</p>
                <StrippedList>
                    <StrippedItem icon="check">{c('new_plans: Upsell attribute').t`10 VPN connections`}</StrippedItem>
                    <StrippedItem icon="check">{c('new_plans: Upsell attribute')
                        .t`Advanced VPN features`}</StrippedItem>
                    <StrippedItem icon="check">{c('new_plans: Upsell attribute')
                        .t`500 GB storage for email and file storage `}</StrippedItem>
                    <StrippedItem icon="check">{c('new_plans: Upsell attribute')
                        .t`15 Proton email addresses`}</StrippedItem>
                    <StrippedItem icon="check">{c('new_plans: Upsell attribute')
                        .t`Support for 3 custom email domains`}</StrippedItem>
                    <StrippedItem icon="check">{c('new_plans: Upsell attribute')
                        .t`Up to 20 personal calendars`}</StrippedItem>
                    <StrippedItem icon="check">{c('new_plans: Upsell attribute')
                        .t`Links to share calendars, files, and folders`}</StrippedItem>
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
