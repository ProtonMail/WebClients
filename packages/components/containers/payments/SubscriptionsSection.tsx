import { useMemo } from 'react';

import { c, msgid } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useGetPaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { DropdownActionProps } from '@proton/components/components/dropdown/DropdownActions';
import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import Info from '@proton/components/components/link/Info';
import Loader from '@proton/components/components/loader/Loader';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import Time from '@proton/components/components/time/Time';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useCancellationTelemetry from '@proton/components/containers/payments/subscription/cancellationFlow/useCancellationTelemetry';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import {
    Renew,
    type Subscription,
    changeRenewState,
    getRenewalTime,
    getSubscriptionPlanTitle,
    hasLifetimeCoupon,
    isFreeSubscription,
    isManagedExternally,
    isUpcomingSubscriptionUnpaid,
    subscriptionExpires,
} from '@proton/payments';
import { isReferralTrial, shouldHaveUpcomingSubscription } from '@proton/payments/core/subscription/helpers';
import { useIsB2BTrial } from '@proton/payments/ui';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import type { BadgeType } from '../../components/badge/Badge';
import { default as Badge } from '../../components/badge/Badge';
import { getSubscriptionManagerName } from './subscription/InAppPurchaseModal';

interface SubscriptionRowProps {
    subscription: Subscription;
}

const SubscriptionRow = ({ subscription }: SubscriptionRowProps) => {
    const [reactivating, withReactivating] = useLoading();
    const api = useApi();
    const { sendDashboardReactivateReport } = useCancellationTelemetry();
    const eventManager = useEventManager();
    const { createNotification } = useNotifications();
    const upcoming = subscription?.UpcomingSubscription ?? undefined;
    const [organization] = useOrganization();
    const isB2BTrial = useIsB2BTrial(subscription, organization);
    const [user] = useUser();
    const getPaymentMethods = useGetPaymentMethods();

    const { planTitle } = getSubscriptionPlanTitle(user, subscription);

    const { renewDisabled, subscriptionExpiresSoon } = subscriptionExpires(subscription);

    const status = useMemo(() => {
        if (subscriptionExpiresSoon) {
            return {
                type: 'error' as BadgeType,
                label: c('Subscription status').t`Expiring`,
            };
        }

        if (isB2BTrial) {
            return {
                type: 'success' as BadgeType,
                label: c('Subscription status').t`Free Trial`,
            };
        }

        return {
            type: 'success' as BadgeType,
            label: c('Subscription status').t`Active`,
        };
    }, [subscriptionExpiresSoon, isB2BTrial]);

    if (isFreeSubscription(subscription)) {
        return null;
    }

    const showReactivateButton = renewDisabled && !isManagedExternally(subscription);
    const reactivateAction: DropdownActionProps[] = [
        showReactivateButton && {
            text: c('Action subscription').t`Reactivate`,
            loading: reactivating,
            onClick: () => {
                withReactivating(async () => {
                    // For Referral Trials only: Check if user has payment methods before reactivating
                    const paymentMethods = await getPaymentMethods();
                    if (isReferralTrial(subscription) && paymentMethods.length === 0) {
                        createNotification({
                            type: 'error',
                            text: c('Error').t`Please add a payment method before reactivating your subscription`,
                        });
                        return;
                    }

                    const searchParams = new URLSearchParams(location.search);
                    const reactivationSource = searchParams.get('source');
                    sendDashboardReactivateReport(reactivationSource || 'default');

                    await api(
                        changeRenewState({
                            RenewalState: Renew.Enabled,
                        })
                    );

                    await eventManager.call();
                }).catch(noop);
            },
        },
    ].filter(isTruthy);

    const latestSubscription = upcoming ?? subscription;

    const { renewAmount, renewCurrency, renewCycle } = (() => {
        const hasUpcomingUnpaidSubscription = upcoming && isUpcomingSubscriptionUnpaid(subscription);
        if (hasUpcomingUnpaidSubscription) {
            return {
                // typically upcoming unpaid subscription have Amount == 0. This behavior might change in the future and
                // take into account the actual amount that take into account coupons. But currently we need to fallback
                // to BaseRenewAmount which is typically set to the full amount of the selected plan. And it doesn't make
                // sense to use RenewAmount for unpaid upcoming subscription because we want to know what user will pay
                // when we actually trigger the charge for this subscription term.
                renewAmount: upcoming.Amount || upcoming.BaseRenewAmount,
                renewCurrency: upcoming.Currency,
                renewCycle: upcoming.Cycle,
            };
        }

        return {
            renewAmount: latestSubscription.RenewAmount,
            renewCurrency: latestSubscription.Currency,
            renewCycle: latestSubscription.RenewCycle,
        };
    })();

    const renewalText = (() => {
        if (hasLifetimeCoupon(subscription)) {
            return c('Payments.Lifetime Subscription').t`Lifetime accounts can be transferred or sold`;
        }

        if (isManagedExternally(subscription)) {
            const subscriptionManagerName = getSubscriptionManagerName(subscription.External);
            // translator: possible values are "Google Play" or "Apple App Store". This sentence means "Subscription renews automatically on Google Play (or Apple App Store)"
            return c('Billing cycle').t`Renews automatically on ${subscriptionManagerName}`;
        }

        // This condition handles transitional states: when subscription was already created, but we don't have the
        // upcoming subscription yet. It typically takes up to 1 minute for upcoming subscription to be created in case
        // of variable cycle offers. In an ideal world, we wouldn't need this condition, but because of limitations of
        // backend-chargebee integration, we should avoid displaying potentially incorrect data.
        // The only case that we handle here is:
        //  - current subscription that must have a variable cycle offer (e.g. vpn2024 24m -> 12m)
        //
        // There are other situations with upcoming subscription that luckily don't require special handling and we
        // simply can take RenewCycle and RenewAmount from the latest subscription.
        // - upcoming subscription that must have a variable cycle offer. For example, user with current vpn2024 12m
        //   creates vpn2024 24m upcoming. In this case it's assumed that the upcoming subscription will eventually have
        //   its own upcoming subscription with 12m cycle.
        // - users with 24m subscriptions before the cutoff date. For example, users with mail2022 24m subscription that
        //   were created before Q1 2025. These users must have 24m renew cycle and the corresponding amount.
        if (shouldHaveUpcomingSubscription(subscription) && !upcoming) {
            return null;
        }

        const renewPrice = getSimplePriceString(renewCurrency, renewAmount);

        return c('Billing cycle').ngettext(
            msgid`Renews automatically at ${renewPrice}, for ${renewCycle} month`,
            `Renews automatically at ${renewPrice}, for ${renewCycle} months`,
            renewCycle
        );
    })();

    const renewalTextElement = <span data-testid="renewalNotice">{renewalText}</span>;

    const renewalTooltip = (() => {
        if (hasLifetimeCoupon(subscription)) {
            return (
                <Info
                    className="ml-2"
                    title={c('Payments.Lifetime Subscription')
                        .t`Reach out to Customer Support to confirm ownership change`}
                />
            );
        }

        if (!isManagedExternally(subscription)) {
            <Info className="ml-2" title={c('Payments').t`Credits and discounts are reflected in your invoice`} />;
        }

        return null;
    })();

    return (
        <TableRow>
            <TableCell label={c('Title subscription').t`Plan`}>
                <span data-testid="planNameId">{planTitle}</span>
            </TableCell>
            <TableCell data-testid="subscriptionStatusId">
                <Badge type={status.type} className="text-nowrap">
                    {status.label}
                </Badge>
            </TableCell>
            <TableCell label={c('Title subscription').t`End date`}>
                <div className="flex items-center">
                    {hasLifetimeCoupon(subscription) ? (
                        c('Payments.Lifetime Subscription.Renewal time').t`Never`
                    ) : (
                        <Time format="PPP" sameDayFormat={false} data-testid="planEndTimeId">
                            {getRenewalTime(subscription)}
                        </Time>
                    )}
                    {subscriptionExpiresSoon && (
                        <Tooltip
                            title={c('Info subscription').t`You can prevent expiry by reactivating the subscription`}
                            data-testid="periodEndWarning"
                        >
                            <IcExclamationCircleFilled className="color-danger ml-1" size={4.5} />
                        </Tooltip>
                    )}
                </div>
            </TableCell>
            <TableCell data-testid="subscriptionActionsId">
                {subscriptionExpiresSoon ? (
                    <DropdownActions size="small" list={reactivateAction} />
                ) : (
                    <div className="flex items-center">
                        {renewalTextElement}
                        {renewalTooltip}
                    </div>
                )}
            </TableCell>
        </TableRow>
    );
};

const SubscriptionsSection = () => {
    const [subscription, subscriptionLoading] = useSubscription();
    if (subscriptionLoading || !subscription) {
        return <Loader />;
    }

    const subscriptions = [subscription, ...(subscription.SecondarySubscriptions ?? [])];

    return (
        <SettingsSectionWide>
            <div style={{ overflow: 'auto' }}>
                <Table className="table-auto" responsive="cards">
                    <TableHeader>
                        <TableRow>
                            <TableCell type="header">{c('Title subscription').t`Plan`}</TableCell>
                            <TableCell type="header">{c('Title subscription').t`Status`}</TableCell>
                            <TableCell type="header">{c('Title subscription').t`End date`}</TableCell>
                            <TableCell type="header"> </TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody colSpan={4}>
                        {subscriptions.map((subscription) => (
                            <SubscriptionRow key={subscription.ID} subscription={subscription} />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </SettingsSectionWide>
    );
};
export default SubscriptionsSection;
