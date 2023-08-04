import { ReactElement } from 'react';

import { c } from 'ttag';

import { DropdownActionProps } from '@proton/components/components/dropdown/DropdownActions';
import { useLoading } from '@proton/hooks';
import { changeRenewState } from '@proton/shared/lib/api/payments';
import { getCheckResultFromSubscription, getCheckout } from '@proton/shared/lib/helpers/checkout';
import { toMap } from '@proton/shared/lib/helpers/object';
import { getHasVpnB2BPlan, getPlanIDs, getVPNDedicatedIPs } from '@proton/shared/lib/helpers/subscription';
import { Currency, Cycle, Renew } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import {
    DropdownActions,
    Icon,
    Loader,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
    Time,
    Tooltip,
} from '../../components';
import { default as Badge, Props as BadgeProps } from '../../components/badge/Badge';
import Price from '../../components/price/Price';
import { useApi, useEventManager, usePlans, useSubscription } from '../../hooks';
import { SettingsSectionWide } from '../account';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import { getShortBillingText } from './helper';
import { useSubscriptionModal } from './subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from './subscription/constants';
import { subscriptionExpires } from './subscription/helpers';

const getRenewalText = (periodEnd: number) => {
    const formattedEndTime = (
        <Time sameDayFormat={false} key="text-time">
            {periodEnd}
        </Time>
    );
    // translator: formattedEndTime uses a "long localized date" format ('PP' format in https://date-fns.org/v2.29.3/docs/format). E.g.: formattedEndTime = "Dec 12, 2022"
    return c('Billing cycle').jt`Renews automatically on ${formattedEndTime}`;
};

interface SubscriptionRowProps {
    planTitle: string;
    Cycle: Cycle;
    users: number;
    PeriodStart: number;
    PeriodEnd: number;
    PricePerCycle: number;
    Currency: Currency;
    status: {
        label: string;
        type: BadgeProps['type'];
    };
    asterisk?: ReactElement;
    actions?: ReactElement;
    showPeriodEndWarning?: boolean;
    servers?: number;
}

const SubscriptionRow = ({
    planTitle,
    Cycle,
    users,
    PeriodStart,
    PeriodEnd,
    PricePerCycle,
    Currency,
    status,
    asterisk,
    actions,
    showPeriodEndWarning = false,
    servers,
}: SubscriptionRowProps) => {
    return (
        <TableRow>
            <TableCell label={c('Title subscription').t`Plan`}>
                <span data-testid="planNameId">
                    {planTitle}
                    {asterisk}
                </span>
            </TableCell>
            <TableCell label={c('Title subscription').t`Duration`}>
                <span data-testid="planPeriodId">{getShortBillingText(Cycle)}</span>
            </TableCell>
            <TableCell label={c('Title subscription').t`Users`}>
                <span data-testid="amountOfUsersId">{users}</span>
            </TableCell>
            {servers === undefined ? null : (
                <TableCell label={c('Title subscription').t`Servers`}>
                    <span data-testid="amountOfServersId">{servers > 0 ? servers : '-'}</span>
                </TableCell>
            )}
            <TableCell label={c('Title subscription').t`Start date`}>
                <Time format="PP" sameDayFormat={false} data-testid="planStartTimeId">
                    {PeriodStart}
                </Time>
            </TableCell>
            <TableCell label={c('Title subscription').t`End date`}>
                <Time format="PP" sameDayFormat={false} data-testid="planEndTimeId">
                    {PeriodEnd}
                </Time>
                {showPeriodEndWarning && (
                    <Tooltip
                        title={c('Info subscription').t`You can prevent expiry by reactivating the subscription`}
                        data-testid="periodEndWarning"
                    >
                        <Icon name="exclamation-circle-filled" className="color-danger ml-1" size={18} />
                    </Tooltip>
                )}
            </TableCell>
            <TableCell
                data-testid="priceId"
                label={c('Title subscription').t`Total paid`}
                className="on-mobile-text-left on-tablet-text-left text-right"
            >
                <Price currency={Currency}>{PricePerCycle}</Price>
            </TableCell>
            <TableCell
                data-testid="subscriptionStatusId"
                className="on-mobile-text-left on-tablet-text-left text-right"
            >
                <Badge type={status.type}>{status.label}</Badge>
            </TableCell>
            <TableCell
                data-testid="subscriptionActionsId"
                className="on-mobile-text-left on-tablet-text-left text-right"
            >
                {actions}
            </TableCell>
        </TableRow>
    );
};

const SubscriptionsSection = () => {
    const [plans, loadingPlans] = usePlans();
    const [current, loadingSubscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();
    const upcoming = current?.UpcomingSubscription ?? undefined;
    const api = useApi();
    const eventManager = useEventManager();
    const [reactivating, withReactivating] = useLoading();

    if (loadingSubscription || loadingPlans) {
        return <Loader />;
    }

    if (current.isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    const plansMap = toMap(plans, 'Name');

    const currentCheckout = getCheckout({
        plansMap,
        planIDs: getPlanIDs(current),
        checkResult: getCheckResultFromSubscription(current),
    });

    const upcomingCheckout = getCheckout({
        plansMap,
        planIDs: getPlanIDs(upcoming),
        checkResult: getCheckResultFromSubscription(upcoming),
    });

    const { renewEnabled, subscriptionExpiresSoon } = subscriptionExpires(current);

    const asterisk = <span>* </span>;
    const asteriskForCurrent = upcoming ? undefined : asterisk;

    const renewalDate = upcoming?.PeriodEnd ?? current.PeriodEnd;

    const dropdownActions: DropdownActionProps[] = [
        renewEnabled && {
            text: c('Action subscription').t`Manage`,
            onClick: () =>
                openSubscriptionModal({
                    step: SUBSCRIPTION_STEPS.CHECKOUT,
                }),
        },
        !renewEnabled && {
            text: c('Action subscription').t`Reactivate`,
            loading: reactivating,
            onClick: () => {
                withReactivating(async () => {
                    await api(
                        changeRenewState({
                            RenewalState: Renew.Enabled,
                        })
                    );

                    await eventManager.call();
                });
            },
        },
    ].filter(isTruthy);
    const actions = <DropdownActions size="small" list={dropdownActions} />;

    const servers = getHasVpnB2BPlan(current) ? getVPNDedicatedIPs(current) : undefined;
    const serversUpcoming = getHasVpnB2BPlan(upcoming) ? getVPNDedicatedIPs(upcoming) : undefined;

    return (
        <SettingsSectionWide>
            <div style={{ overflow: 'auto' }}>
                <Table className="table-auto" responsive="cards">
                    <TableHeader>
                        <TableRow>
                            <TableCell type="header">{c('Title subscription').t`Plan`}</TableCell>
                            <TableCell type="header">{c('Title subscription').t`Duration`}</TableCell>
                            <TableCell type="header">{c('Title subscription').t`Users`}</TableCell>
                            {servers === undefined && serversUpcoming === undefined ? null : (
                                <TableCell type="header">{c('Title subscription').t`Servers`}</TableCell>
                            )}
                            <TableCell type="header">{c('Title subscription').t`Start date`}</TableCell>
                            <TableCell type="header">{c('Title subscription').t`End date`}</TableCell>
                            <TableCell type="header" className="text-right">{c('Title subscription')
                                .t`Total`}</TableCell>
                            <TableCell type="header" className="text-right">{c('Title subscription')
                                .t`Status`}</TableCell>
                            <TableCell type="header" className="text-right">{c('Title subscription')
                                .t`Actions`}</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody colSpan={8}>
                        <SubscriptionRow
                            {...currentCheckout}
                            {...current}
                            PricePerCycle={currentCheckout.withDiscountPerCycle}
                            status={
                                subscriptionExpiresSoon
                                    ? {
                                          type: 'error',
                                          label: c('Subscription status').t`Expiring`,
                                      }
                                    : { type: 'success', label: c('Subscription status').t`Active` }
                            }
                            asterisk={renewEnabled ? asteriskForCurrent : undefined}
                            actions={actions}
                            showPeriodEndWarning={subscriptionExpiresSoon}
                            servers={servers}
                        ></SubscriptionRow>
                        {upcoming && (
                            <SubscriptionRow
                                {...upcomingCheckout}
                                {...upcoming}
                                PricePerCycle={upcoming.RenewAmount}
                                status={{ type: 'info', label: c('Subscription status').t`Upcoming` }}
                                asterisk={renewEnabled ? asterisk : undefined}
                                servers={serversUpcoming}
                            ></SubscriptionRow>
                        )}
                    </TableBody>
                </Table>
                <div className="flex w100 mb-4 color-weak text-right mt-4">
                    <div
                        className="on-mobile-text-left on-tablet-text-left text-right w100"
                        data-testid="renewalDateInfo"
                    >
                        {renewEnabled && asterisk}
                        {renewEnabled && getRenewalText(renewalDate)}
                    </div>
                </div>
            </div>
        </SettingsSectionWide>
    );
};

export default SubscriptionsSection;
