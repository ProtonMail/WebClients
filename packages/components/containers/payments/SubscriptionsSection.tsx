import { ReactElement } from 'react';

import { c } from 'ttag';

import { getCheckResultFromSubscription, getCheckout } from '@proton/shared/lib/helpers/checkout';
import { toMap } from '@proton/shared/lib/helpers/object';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { Currency, Cycle } from '@proton/shared/lib/interfaces';

import { Loader, Table, TableBody, TableCell, TableHeader, TableRow, Time } from '../../components';
import { default as Badge, Props as BadgeProps } from '../../components/badge/Badge';
import Price from '../../components/price/Price';
import { usePlans, useSubscription } from '../../hooks';
import { SettingsSectionWide } from '../account';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import { getShortBillingText } from './helper';

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
}: SubscriptionRowProps) => {
    return (
        <TableRow>
            <TableCell label={c('Title').t`Plan`}>
                <span data-testid="planNameId">
                    {planTitle}
                    {asterisk}
                </span>
            </TableCell>
            <TableCell label={c('Title').t`Duration`}>
                <span data-testid="planPeriodId">{getShortBillingText(Cycle)}</span>
            </TableCell>
            <TableCell label={c('Title').t`Users`}>
                <span data-testid="amountOfUsersId">{users}</span>
            </TableCell>
            <TableCell label={c('Title').t`Start date`}>
                <Time format="PP" sameDayFormat={false} data-testid="planStartTimeId">
                    {PeriodStart}
                </Time>
            </TableCell>
            <TableCell label={c('Title').t`End date`}>
                <Time format="PP" sameDayFormat={false} data-testid="planEndTimeId">
                    {PeriodEnd}
                </Time>
            </TableCell>
            <TableCell
                data-testid="priceId"
                label={c('Title').t`Total paid`}
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
        </TableRow>
    );
};

const SubscriptionsSection = () => {
    const [plans, loadingPlans] = usePlans();
    const [current, loadingSubscription] = useSubscription();
    const upcoming = current?.UpcomingSubscription;

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

    const asterisk = <span>* </span>;
    const asteriskForCurrent = upcoming ? undefined : asterisk;

    const renewalDate = upcoming?.PeriodEnd ?? current.PeriodEnd;

    return (
        <SettingsSectionWide>
            <div style={{ overflow: 'auto' }}>
                <Table className="table-auto" responsive="cards">
                    <TableHeader>
                        <TableRow>
                            <TableCell type="header">{c('Title').t`Plan`}</TableCell>
                            <TableCell type="header">{c('Title').t`Duration`}</TableCell>
                            <TableCell type="header">{c('Title').t`Users`}</TableCell>
                            <TableCell type="header">{c('Title').t`Start date`}</TableCell>
                            <TableCell type="header">{c('Title').t`End date`}</TableCell>
                            <TableCell type="header" className="text-right">{c('Title').t`Total paid`}</TableCell>
                            <TableCell type="header"> </TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody colSpan={8}>
                        <SubscriptionRow
                            {...currentCheckout}
                            {...current}
                            PricePerCycle={currentCheckout.withDiscountPerCycle}
                            status={{ type: 'success', label: c('Subscription status').t`Active` }}
                            asterisk={asteriskForCurrent}
                        ></SubscriptionRow>
                        {upcoming && (
                            <SubscriptionRow
                                {...upcomingCheckout}
                                {...upcoming}
                                PricePerCycle={upcoming.RenewAmount}
                                status={{ type: 'info', label: c('Subscription status').t`Upcoming` }}
                                asterisk={asterisk}
                            ></SubscriptionRow>
                        )}
                    </TableBody>
                </Table>
                <div className="flex w100 mb-4 color-weak text-right mt-4">
                    <div
                        className="on-mobile-text-left on-tablet-text-left text-right w100"
                        data-testid="renewalDateInfo"
                    >
                        {asterisk}
                        {getRenewalText(renewalDate)}
                    </div>
                </div>
            </div>
        </SettingsSectionWide>
    );
};

export default SubscriptionsSection;
