import type { Subscription } from '@proton/payments';

const format = (
    subscription: Subscription,
    UpcomingSubscription: Subscription | undefined | null,
    SecondarySubscriptions: Subscription[] | undefined | null
): Subscription => {
    return {
        ...subscription,
        UpcomingSubscription: UpcomingSubscription || undefined,
        SecondarySubscriptions: SecondarySubscriptions || undefined,
    };
};

export default format;
