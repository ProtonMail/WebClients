import { useMemo } from 'react';

import { c, msgid } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Tooltip } from '@proton/atoms';
import type { DropdownActionProps } from '@proton/components/components/dropdown/DropdownActions';
import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import Icon from '@proton/components/components/icon/Icon';
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
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import { useLoading } from '@proton/hooks';
import {
    PLANS,
    type PlansMap,
    Renew,
    type Subscription,
    changeRenewState,
    getHas2023OfferCoupon,
    getIsUpcomingSubscriptionUnpaid,
    getNormalCycleFromCustomCycle,
    getPlanIDs,
    getPlanTitle,
    getRenewalTime,
    isManagedExternally,
    onSessionMigrationPaymentsVersion,
} from '@proton/payments';
import { useIsB2BTrial } from '@proton/payments/ui';
import { getCheckout, getOptimisticCheckResult } from '@proton/shared/lib/helpers/checkout';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import type { BadgeType } from '../../components/badge/Badge';
import { default as Badge } from '../../components/badge/Badge';
import { getSubscriptionManagerName } from './subscription/InAppPurchaseModal';
import { subscriptionExpires } from './subscription/helpers';

interface SubscriptionRowProps {
    subscription: Subscription;
    plansMap: PlansMap;
}

const SubscriptionRow = ({ subscription, plansMap }: SubscriptionRowProps) => {
    const [reactivating, withReactivating] = useLoading();
    const api = useApi();
    const { sendDashboardReactivateReport } = useCancellationTelemetry();
    const [user] = useUser();
    const eventManager = useEventManager();
    const upcoming = subscription?.UpcomingSubscription ?? undefined;
    const [organization] = useOrganization();

    const planTitle = getPlanTitle(subscription);

    const { renewDisabled, subscriptionExpiresSoon } = subscriptionExpires(subscription);

    const isB2BTrial = useIsB2BTrial(subscription, organization);

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
                            onSessionMigrationPaymentsVersion(user, subscription)
                        )
                    );

                    await eventManager.call();
                }).catch(noop);
            },
        },
    ].filter(isTruthy);

    const latestSubscription = upcoming ?? subscription;

    const isUpcomingSubscriptionUnpaid = getIsUpcomingSubscriptionUnpaid(subscription);

    const { renewAmount, renewCurrency, renewLength } = (() => {
        const latestPlanIDs = getPlanIDs(latestSubscription);
        if (getHas2023OfferCoupon(latestSubscription.CouponCode) && latestPlanIDs[PLANS.VPN_PASS_BUNDLE]) {
            const nextCycle = getNormalCycleFromCustomCycle(latestSubscription.Cycle);
            const latestCheckout = getCheckout({
                plansMap,
                planIDs: latestPlanIDs,
                checkResult: getOptimisticCheckResult({
                    planIDs: latestPlanIDs,
                    plansMap,
                    cycle: nextCycle,
                    currency: latestSubscription.Currency,
                }),
            });
            return {
                // The API doesn't return the correct next cycle or RenewAmount for the VPN or VPN+Pass bundle plan since we don't have chargebee
                // So we calculate it with the cycle discount here
                renewAmount: latestCheckout.withDiscountPerCycle,
                renewCurrency: latestSubscription.Currency,
                renewLength: nextCycle,
            };
        }

        if (upcoming && isUpcomingSubscriptionUnpaid) {
            return {
                renewAmount: upcoming.Amount,
                renewCurrency: upcoming.Currency,
                renewLength: upcoming.Cycle,
            };
        }

        return {
            renewAmount: latestSubscription.RenewAmount,
            renewCurrency: latestSubscription.Currency,
            renewLength: latestSubscription.Cycle,
        };
    })();

    const renewalText = (() => {
        if (isManagedExternally(subscription)) {
            const subscriptionManagerName = getSubscriptionManagerName(subscription.External);
            // translator: possible values are "Google Play" or "Apple App Store". This sentence means "Subscription renews automatically on Google Play (or Apple App Store)"
            return c('Billing cycle').t`Renews automatically on ${subscriptionManagerName}`;
        }

        const renewPrice = getSimplePriceString(renewCurrency, renewAmount);
        return c('Billing cycle').ngettext(
            msgid`Renews automatically at ${renewPrice}, for ${renewLength} month`,
            `Renews automatically at ${renewPrice}, for ${renewLength} months`,
            renewLength
        );
    })();

    const renewalTextElement = <span data-testid="renewalNotice">{renewalText}</span>;

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
                    <Time format="PPP" sameDayFormat={false} data-testid="planEndTimeId">
                        {getRenewalTime(subscription)}
                    </Time>
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
            <TableCell data-testid="subscriptionActionsId">
                {subscriptionExpiresSoon ? (
                    <DropdownActions size="small" list={reactivateAction} />
                ) : (
                    renewalTextElement
                )}
            </TableCell>
        </TableRow>
    );
};

const SubscriptionsSection = () => {
    const { plansMap, plansMapLoading } = usePreferredPlansMap();

    const [subscription, subscriptionLoading] = useSubscription();

    if (subscriptionLoading || plansMapLoading || !subscription) {
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
                            <SubscriptionRow key={subscription.ID} subscription={subscription} plansMap={plansMap} />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </SettingsSectionWide>
    );
};
export default SubscriptionsSection;
