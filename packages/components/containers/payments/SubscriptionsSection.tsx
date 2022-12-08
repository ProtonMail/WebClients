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
    const formattedEndTime = <Time key="time-text">{periodEnd}</Time>;
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
            <TableCell>
                <span>
                    {planTitle}
                    {asterisk}
                </span>
            </TableCell>
            <TableCell>
                <span>{getShortBillingText(Cycle)}</span>
            </TableCell>
            <TableCell>
                <span>{users}</span>
            </TableCell>
            <TableCell>
                <Time forceFormat={true}>{PeriodStart}</Time>
            </TableCell>
            <TableCell>
                <Time forceFormat={true}>{PeriodEnd}</Time>
            </TableCell>
            <TableCell className="text-right">
                <Price currency={Currency}>{PricePerCycle}</Price>
            </TableCell>
            <TableCell className="text-right">
                <Badge type={status.type}>{status.label}</Badge>
            </TableCell>
        </TableRow>
    );
};

const SubscriptionsSection = () => {
    const [plans, loadingPlans] = usePlans();
    const [current, loadingSubscription] = useSubscription();
    const upcoming = current?.upcoming;

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

    const renewalDate = upcoming?.PeriodEnd ?? current.PeriodEnd;

    return (
        <SettingsSectionWide>
            <div style={{ overflow: 'auto' }}>
                <Table className="table-auto">
                    <TableHeader>
                        <TableRow>
                            <TableCell type="header">{c('Title').t`Plan`}</TableCell>
                            <TableCell type="header">{c('Title').t`Length`}</TableCell>
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
                <div className="flex w100 mb1 color-weak text-right mt1">
                    <div className="text-right w100">
                        {asterisk}
                        {getRenewalText(renewalDate)}
                    </div>
                </div>
            </div>
        </SettingsSectionWide>
    );
};

export default SubscriptionsSection;
