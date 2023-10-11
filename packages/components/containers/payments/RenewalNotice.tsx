import { addMonths } from 'date-fns';
import { c } from 'ttag';

import { Subscription } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { Icon, Time } from '../../components';

export type RenewalNoticeProps = {
    renewCycle: number;
    isCustomBilling?: boolean;
    isScheduledSubscription?: boolean;
    subscription?: Subscription;
};

export const getRenewalNoticeText = ({
    renewCycle,
    isCustomBilling,
    isScheduledSubscription,
    subscription,
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

    return c('Info').jt`Your subscription will automatically renew on ${renewalTime}.`;
};

export interface Props extends RenewalNoticeProps {
    className?: string;
}

const RenewalNotice = ({ renewCycle, isCustomBilling, isScheduledSubscription, subscription, className }: Props) => {
    return (
        <div className={clsx('flex flex-nowrap color-weak', className)}>
            <span className="flex-item-noshrink">
                <Icon name="info-circle" size={16} />
            </span>
            <span className="flex-item-fluid ml-2 mt-0.5 text-sm">
                {getRenewalNoticeText({
                    renewCycle,
                    isCustomBilling,
                    isScheduledSubscription,
                    subscription,
                })}
            </span>
        </div>
    );
};

export default RenewalNotice;
