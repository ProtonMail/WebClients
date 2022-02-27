import { Subscription } from '@proton/shared/lib/interfaces';
import { isTrial } from '@proton/shared/lib/helpers/subscription';
import { fromUnixTime, subDays } from 'date-fns';
import { Feature } from '../../features';

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
    // Should be in trial and 3 days before end
    const willEndSoon = new Date() >= subDays(endDate, 3);

    const open = willEndSoon && feature?.Value === false;

    return { open, endDate };
};
