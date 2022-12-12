import { c } from 'ttag';

import { getCheckResultFromSubscription, getCheckout } from '@proton/shared/lib/helpers/checkout';
import { toMap } from '@proton/shared/lib/helpers/object';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';

import { Badge, Loader, Table, TableBody, TableCell, TableHeader, TableRow, Time } from '../../components';
import Price from '../../components/price/Price';
import { usePlans, useSubscription } from '../../hooks';
import { SettingsSectionWide } from '../account';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import { getShortBillingText } from './helper';

const SubscriptionsSection = () => {
    const [plans, loadingPlans] = usePlans();
    const [current, loadingSubscription] = useSubscription();

    if (loadingSubscription || loadingPlans) {
        return <Loader />;
    }

    if (current.isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    const upcoming = current.upcoming;

    const plansMap = toMap(plans, 'Name');

    const upcomingCheckResult = getCheckResultFromSubscription(upcoming);
    const upcomingCheckout = getCheckout({
        planIDs: getPlanIDs(upcoming),
        plansMap,
        checkResult: upcomingCheckResult,
    });

    const upcomingSubscription = upcoming && (
        <TableRow
            cells={[
                <span>{upcomingCheckout.planTitle}</span>,
                <span>{getShortBillingText(upcomingCheckResult.Cycle)}</span>,
                <span>{upcomingCheckout.users}</span>,
                <Time forceFormat={true}>{upcoming.PeriodStart}</Time>,
                <Time forceFormat={true}>{upcoming.PeriodEnd}</Time>,
                <Price currency={upcoming.Currency}>{upcoming.RenewAmount / upcoming.Cycle}</Price>,
                <Price currency={upcoming.Currency}>{upcoming.RenewAmount}</Price>,
                <Badge type="info">{c('Subscription status').t`Upcoming`}</Badge>,
            ]}
        ></TableRow>
    );

    const currentCheckResult = getCheckResultFromSubscription(current);

    const currentCheckout = getCheckout({
        planIDs: getPlanIDs(current),
        plansMap,
        checkResult: currentCheckResult,
    });

    return (
        <SettingsSectionWide>
            <div style={{ overflow: 'auto' }}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableCell type="header">{c('Title').t`Plan`}</TableCell>
                            <TableCell type="header">{c('Title').t`Length`}</TableCell>
                            <TableCell type="header">{c('Title').t`Users`}</TableCell>
                            <TableCell type="header">{c('Title').t`Start date`}</TableCell>
                            <TableCell type="header">{c('Title').t`End date`}</TableCell>
                            <TableCell type="header">{c('Title').t`Price per month`}</TableCell>
                            <TableCell type="header">{c('Title').t`Total paid`}</TableCell>
                            <TableCell type="header"> </TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody colSpan={8}>
                        <TableRow
                            cells={[
                                <span>{currentCheckout.planTitle}</span>,
                                <span>{getShortBillingText(currentCheckResult.Cycle)}</span>,
                                <span>{currentCheckout.users}</span>,
                                <Time forceFormat={true}>{current.PeriodStart}</Time>,
                                <Time forceFormat={true}>{current.PeriodEnd}</Time>,
                                <Price currency={current.Currency}>{currentCheckout.withDiscountPerMonth}</Price>,
                                <Price currency={current.Currency}>{currentCheckout.withDiscountPerCycle}</Price>,
                                <Badge type="success">{c('Subscription status').t`Active`}</Badge>,
                            ]}
                        ></TableRow>
                        {upcomingSubscription}
                    </TableBody>
                </Table>
            </div>
        </SettingsSectionWide>
    );
};

export default SubscriptionsSection;
