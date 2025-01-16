import type { Subscription } from '@proton/shared/lib/interfaces';

const format = (subscription: Subscription, UpcomingSubscription: Subscription | undefined | null): Subscription => {
    return {
        ...subscription,
        UpcomingSubscription: UpcomingSubscription || undefined,
    };
};

export default format;
