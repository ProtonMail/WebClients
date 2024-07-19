import type { Subscription, SubscriptionModel } from '@proton/shared/lib/interfaces';

import { isManagedByMozilla } from './helpers';

const format = (
    subscription: Subscription,
    UpcomingSubscription: Subscription | undefined | null
): SubscriptionModel => {
    return {
        ...subscription,
        UpcomingSubscription: UpcomingSubscription || undefined,
        isManagedByMozilla: isManagedByMozilla(subscription),
    };
};

export default format;
