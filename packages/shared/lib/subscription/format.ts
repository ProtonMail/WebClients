import { type Subscription } from '@proton/payments';

const format = (subscription: Subscription, UpcomingSubscription: Subscription | undefined | null): Subscription => {
    return {
        ...subscription,
        UpcomingSubscription: UpcomingSubscription || undefined,
    };
};

export default format;
