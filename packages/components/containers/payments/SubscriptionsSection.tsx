import { c, msgid } from 'ttag';

import { DropdownActionProps } from '@proton/components/components/dropdown/DropdownActions';
import { onSessionMigrationPaymentsVersion } from '@proton/components/payments/core';
import { useLoading } from '@proton/hooks';
import { changeRenewState } from '@proton/shared/lib/api/payments';
import { PLANS } from '@proton/shared/lib/constants';
import { getCheckout, getOptimisticCheckResult } from '@proton/shared/lib/helpers/checkout';
import { toMap } from '@proton/shared/lib/helpers/object';
import { getOptimisticRenewCycleAndPrice } from '@proton/shared/lib/helpers/renew';
import {
    getHas2023OfferCoupon,
    getNormalCycleFromCustomCycle,
    getPlanIDs,
    getPlanTitle,
} from '@proton/shared/lib/helpers/subscription';
import { Renew } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import {
    DropdownActions,
    Icon,
    Loader,
    Price,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
    Time,
    Tooltip,
} from '../../components';
import { default as Badge, BadgeType } from '../../components/badge/Badge';
import { useApi, useEventManager, usePlans, useSubscription, useUser } from '../../hooks';
import { SettingsSectionWide } from '../account';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import { subscriptionExpires } from './subscription/helpers';

export const getMonths = (n: number) => c('Billing cycle').ngettext(msgid`${n} month`, `${n} months`, n);

const SubscriptionsSection = () => {
    const [plansResult, loadingPlans] = usePlans();
    const plans = plansResult?.plans;
    const [current, loadingSubscription] = useSubscription();
    const upcoming = current?.UpcomingSubscription ?? undefined;
    const api = useApi();
    const eventManager = useEventManager();
    const [reactivating, withReactivating] = useLoading();
    const [user] = useUser();

    if (!current || !plans || loadingSubscription || loadingPlans) {
        return <Loader />;
    }

    if (current.isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    const plansMap = toMap(plans, 'Name');
    const planTitle = getPlanTitle(current);

    const { renewEnabled, subscriptionExpiresSoon } = subscriptionExpires(current);

    const reactivateAction: DropdownActionProps[] = [
        !renewEnabled && {
            text: c('Action subscription').t`Reactivate`,
            loading: reactivating,
            onClick: () => {
                withReactivating(async () => {
                    await api(
                        changeRenewState(
                            {
                                RenewalState: Renew.Enabled,
                            },
                            onSessionMigrationPaymentsVersion(user, current)
                        )
                    );

                    await eventManager.call();
                }).catch(noop);
            },
        },
    ].filter(isTruthy);

    const latestSubscription = upcoming ?? current;
    // That's the case for AddonDowngrade subscription mode. If user with addons decreases the number of addons
    // then in might fall under the AddonDowngrade subscription mode. In this case, user doesn't immediately.
    // The upcoming subscription will be created, it will have the same cycle as the current subscription
    // and user will be charged  at the beginning of the upcoming subscription.
    // see PAY-2060 and PAY-2080
    const isUpcomingSubscriptionUnpaid = !!current && !!upcoming && current.Cycle === upcoming.Cycle;

    const { renewPrice, renewalLength } = (() => {
        const latestPlanIDs = getPlanIDs(latestSubscription);
        if (
            getHas2023OfferCoupon(latestSubscription.CouponCode) &&
            (latestPlanIDs[PLANS.VPN] || latestPlanIDs[PLANS.VPN_PASS_BUNDLE])
        ) {
            const nextCycle = getNormalCycleFromCustomCycle(latestSubscription.Cycle);
            const latestCheckout = getCheckout({
                plansMap,
                planIDs: latestPlanIDs,
                checkResult: getOptimisticCheckResult({
                    planIDs: latestPlanIDs,
                    plansMap,
                    cycle: nextCycle,
                }),
            });
            return {
                // The API doesn't return the correct next cycle or RenewAmount for the VPN or VPN+Pass bundle plan since we don't have chargebee
                // So we calculate it with the cycle discount here
                renewPrice: (
                    <Price key="renewal-price" currency={latestSubscription.Currency}>
                        {latestCheckout.withDiscountPerCycle}
                    </Price>
                ),
                renewalLength: getMonths(nextCycle),
            };
        }

        if (latestPlanIDs[PLANS.VPN2024]) {
            const result = getOptimisticRenewCycleAndPrice({
                plansMap,
                planIDs: latestPlanIDs,
                cycle: latestSubscription.Cycle,
            })!;
            return {
                renewPrice: (
                    <Price key="renewal-price" currency={latestSubscription.Currency}>
                        {result.renewPrice}
                    </Price>
                ),
                renewalLength: getMonths(result.renewalLength),
            };
        }

        if (isUpcomingSubscriptionUnpaid) {
            return {
                renewPrice: (
                    <Price key="renewal-price" currency={upcoming.Currency}>
                        {upcoming.Amount}
                    </Price>
                ),
                renewalLength: getMonths(upcoming.Cycle),
            };
        }

        return {
            renewPrice: (
                <Price key="renewal-price" currency={latestSubscription.Currency}>
                    {latestSubscription.RenewAmount}
                </Price>
            ),
            renewalLength: getMonths(latestSubscription.Cycle),
        };
    })();

    const renewalText = (
        <span data-testid="renewalNotice">{c('Billing cycle')
            .jt`Renews automatically at ${renewPrice}, for ${renewalLength}`}</span>
    );

    const status = subscriptionExpiresSoon
        ? {
              type: 'error' as BadgeType,
              label: c('Subscription status').t`Expiring`,
          }
        : { type: 'success' as BadgeType, label: c('Subscription status').t`Active` };

    const renewalDate = isUpcomingSubscriptionUnpaid ? upcoming.PeriodStart : latestSubscription.PeriodEnd;

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
                        <TableRow>
                            <TableCell label={c('Title subscription').t`Plan`}>
                                <span data-testid="planNameId">{planTitle}</span>
                            </TableCell>
                            <TableCell data-testid="subscriptionStatusId">
                                <Badge type={status.type}>{status.label}</Badge>
                            </TableCell>
                            <TableCell label={c('Title subscription').t`End date`}>
                                <Time format="PP" sameDayFormat={false} data-testid="planEndTimeId">
                                    {renewalDate}
                                </Time>
                                {subscriptionExpiresSoon && (
                                    <Tooltip
                                        title={c('Info subscription')
                                            .t`You can prevent expiry by reactivating the subscription`}
                                        data-testid="periodEndWarning"
                                    >
                                        <Icon
                                            name="exclamation-circle-filled"
                                            className="color-danger ml-1"
                                            size={4.5}
                                        />
                                    </Tooltip>
                                )}
                            </TableCell>
                            <TableCell data-testid="subscriptionActionsId">
                                {subscriptionExpiresSoon ? (
                                    <DropdownActions size="small" list={reactivateAction} />
                                ) : (
                                    renewalText
                                )}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </SettingsSectionWide>
    );
};
export default SubscriptionsSection;
