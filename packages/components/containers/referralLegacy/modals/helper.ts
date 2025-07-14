import { addDays, fromUnixTime, subDays } from 'date-fns';

import type { Feature } from '@proton/features';
import { type Subscription } from '@proton/payments';
import { isTrial } from '@proton/payments';

export const getShouldOpenReferralModal = ({
    subscription,
    feature,
}: {
    subscription: Subscription | undefined;
    feature: Feature<boolean> | undefined;
}) => {
    if (!subscription?.PeriodEnd || !isTrial(subscription)) {
        return { open: false, endDate: new Date() };
    }

    const endDate = fromUnixTime(subscription.PeriodEnd);
    const startDate = fromUnixTime(subscription.CreateTime);
    const nowDate = new Date();
    // Should be in trial since a week
    const isExperienced = addDays(startDate, 7) < nowDate;
    // 3 days before the end of the trial
    const willExpire = subDays(endDate, 3) < nowDate;
    const open = (isExperienced && feature?.Value === false) || willExpire;

    return { open, endDate };
};
