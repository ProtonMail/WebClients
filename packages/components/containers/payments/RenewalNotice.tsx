import { addMonths } from 'date-fns';
import { c } from 'ttag';

import { COUPON_CODES, CYCLE } from '@proton/shared/lib/constants';
import { getNormalCycleFromCustomCycle } from '@proton/shared/lib/helpers/subscription';
import { Subscription } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { Icon, Time } from '../../components';

export type RenewalNoticeProps = {
    renewCycle: number;
    isCustomBilling?: boolean;
    isScheduledSubscription?: boolean;
    subscription?: Subscription;
    coupon?: string | null;
};

export const getRenewalNoticeText = ({
    renewCycle,
    isCustomBilling,
    isScheduledSubscription,
    subscription,
    coupon,
}: RenewalNoticeProps) => {
    let unixRenewalTime: number = +addMonths(new Date(), renewCycle) / 1000;
    if (isCustomBilling && subscription) {
        unixRenewalTime = subscription.PeriodEnd;
    }

    if (isScheduledSubscription && subscription) {
        const periodEndMilliseconds = subscription.PeriodEnd * 1000;
        unixRenewalTime = +addMonths(periodEndMilliseconds, renewCycle) / 1000;
    }

    const renewalTime = (
        <Time format="P" key="auto-renewal-time">
            {unixRenewalTime}
        </Time>
    );

    const nextCycle = getNormalCycleFromCustomCycle(renewCycle);

    if (coupon === COUPON_CODES.BLACK_FRIDAY_2023) {
        const start = c('Info').jt`Your subscription will auto-renew on ${renewalTime}.`;
        let end;
        if (nextCycle === CYCLE.MONTHLY) {
            end = c('Info').t`After this date, you'll be billed every month at the regular price.`;
        }
        if (nextCycle === CYCLE.YEARLY) {
            end = c('Info').t`After this date, you'll be billed every 12 months at the normal yearly rate.`;
        }
        if (nextCycle === CYCLE.TWO_YEARS) {
            end = c('Info').t`After this date, you'll be billed every 24 months at the normal 2-year rate.`;
        }
        return [start, ' ', end];
    }

    let start;
    if (nextCycle === CYCLE.MONTHLY) {
        start = c('Info').t`Subscription auto-renews every month.`;
    }
    if (nextCycle === CYCLE.YEARLY) {
        start = c('Info').t`Subscription auto-renews every 12 months.`;
    }
    if (nextCycle === CYCLE.TWO_YEARS) {
        start = c('Info').t`Subscription auto-renews every 24 months.`;
    }

    return [start, ' ', c('Info').jt`Your next billing date is ${renewalTime}.`];
};

export interface Props extends RenewalNoticeProps {
    className?: string;
}

const RenewalNotice = ({
    renewCycle,
    isCustomBilling,
    isScheduledSubscription,
    subscription,
    className,
    coupon,
}: Props) => {
    return (
        <div className={clsx('flex flex-nowrap color-weak', className)}>
            <span className="flex-item-noshrink mr-2">
                <Icon name="info-circle" size={16} />
            </span>
            <span className="flex-item-fluid">
                {getRenewalNoticeText({
                    renewCycle,
                    isCustomBilling,
                    isScheduledSubscription,
                    subscription,
                    coupon,
                })}
            </span>
        </div>
    );
};

export default RenewalNotice;
