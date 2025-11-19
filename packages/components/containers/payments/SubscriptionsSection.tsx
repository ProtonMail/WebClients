import { useMemo } from 'react';

import { c, msgid } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { DropdownActionProps } from '@proton/components/components/dropdown/DropdownActions';
import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import Icon from '@proton/components/components/icon/Icon';
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
import { useLoading } from '@proton/hooks';
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
} from '@proton/payments';
import { shouldHaveUpcomingSubscription as getShouldHaveUpcomingSubscription } from '@proton/payments/core/subscription/helpers';
import { useIsB2BTrial } from '@proton/payments/ui';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import type { BadgeType } from '../../components/badge/Badge';
import { default as Badge } from '../../components/badge/Badge';
import { getSubscriptionManagerName } from './subscription/InAppPurchaseModal';
import { subscriptionExpires } from './subscription/helpers';

interface SubscriptionRowProps {
    subscription: Subscription;
}

const SubscriptionRow = ({ subscription }: SubscriptionRowProps) => {
    const [reactivating, withReactivating] = useLoading();
    const api = useApi();
    const { sendDashboardReactivateReport } = useCancellationTelemetry();
    const eventManager = useEventManager();
    const upcoming = subscription?.UpcomingSubscription ?? undefined;
    const [organization] = useOrganization();
    const isB2BTrial = useIsB2BTrial(subscription, organization);
    const [user] = useUser();

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
                const searchParams = new URLSearchParams(location.search);
                const reactivationSource = searchParams.get('source');

                sendDashboardReactivateReport(reactivationSource || 'default');

                withReactivating(async () => {
                    await api(
                        changeRenewState(
                            {
                                RenewalState: Renew.Enabled,
                            },
                            'v5'
                        )
                    );

                    await eventManager.call();
                }).catch(noop);
            },
        },
    ].filter(isTruthy);

    const latestSubscription = upcoming ?? subscription;

    const renewAmount =
        upcoming && isUpcomingSubscriptionUnpaid(subscription)
            ? // typically upcoming unpaid subscription have Amount == 0. This behavior might change in the future and take
              // into account the actual amount that take into account coupons. But currently we need to fallback to
              // BaseRenewAmount which is typically set to the full amount of the selected plan. And it doesn't make
              // sense to use RenewAmount for unpaid upcoming subscription because we want to know what user will pay
              // when we actually trigger the charge for this subscription term.
              upcoming.Amount || upcoming.BaseRenewAmount
            : latestSubscription.RenewAmount;

    const renewCurrency = latestSubscription.Currency;
    const renewLength = latestSubscription.Cycle;

    const shouldHaveUpcomingSubscription = getShouldHaveUpcomingSubscription(subscription);

    const renewalText = (() => {
        if (hasLifetimeCoupon(subscription)) {
            return c('Payments.Lifetime Subscription').t`Lifetime accounts can be transferred or sold`;
        }

        if (isManagedExternally(subscription)) {
            const subscriptionManagerName = getSubscriptionManagerName(subscription.External);
            // translator: possible values are "Google Play" or "Apple App Store". This sentence means "Subscription renews automatically on Google Play (or Apple App Store)"
            return c('Billing cycle').t`Renews automatically on ${subscriptionManagerName}`;
        }

        /**
         * When user subscribes, for example, to mail2022 24m then the backend must automatically schedule a 12m
         * subscription. In case if this upcoming subscription is missing, it means that the frontend didn't receive the
         * upcoming subscription yet. Typically it's a 2-step process (even though it lasts only one second). First user
         * creates the subscription, we call the events endpoint, and know that we need to fetch the subscription. The
         * frontend fetches the subscription, but at this point it might not have the upcoming subscription yet, because
         * the backend creates the upcoming subscription asynchronously. At this point the frontend has a risk of
         * displaying wrong information about renewal price and cycle. It usually lasts only a second, if happens at
         * all, so soon enough the frontend receives another event that the subscription was updated, and now the
         * frontend finally fetches the subscription endpoint that now contains the upcoming subscription. Basically
         * this condition handles the situation when the upcoming subscription is unexpectedly missing.
         */
        if (shouldHaveUpcomingSubscription && !upcoming) {
            return null;
        }

        const renewPrice = getSimplePriceString(renewCurrency, renewAmount);
        return c('Billing cycle').ngettext(
            msgid`Renews automatically at ${renewPrice}, for ${renewLength} month`,
            `Renews automatically at ${renewPrice}, for ${renewLength} months`,
            renewLength
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

    // Adding an alias to make it clearer that this logic also affects the layout. When we change the renewal text, the
    // size of table cells will change. To prevent it, we manually override the width of table cells. But we do so only
    // when we know that the renewal text can change.
    const mightChangeRenewalText = shouldHaveUpcomingSubscription;

    return (
        <TableRow>
            <TableCell label={c('Title subscription').t`Plan`} className={clsx(mightChangeRenewalText && 'w-1/6')}>
                <span data-testid="planNameId">{planTitle}</span>
            </TableCell>
            <TableCell data-testid="subscriptionStatusId" className={clsx(mightChangeRenewalText && 'w-1/10')}>
                <Badge type={status.type} className="text-nowrap">
                    {status.label}
                </Badge>
            </TableCell>
            <TableCell label={c('Title subscription').t`End date`} className={clsx(mightChangeRenewalText && 'w-2/10')}>
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
                            <Icon name="exclamation-circle-filled" className="color-danger ml-1" size={4.5} />
                        </Tooltip>
                    )}
                </div>
            </TableCell>
            <TableCell data-testid="subscriptionActionsId" className={clsx(mightChangeRenewalText && 'w-full')}>
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
