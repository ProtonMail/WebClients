import { isPaidSubscription } from '../../type-guards';
import { Renew } from '../constants';
import type { MaybeFreeSubscription } from '../interface';

export const isSubscriptionRenewEnabled = (subscription: MaybeFreeSubscription): boolean => {
    if (subscription?.UpcomingSubscription) {
        return subscription?.UpcomingSubscription.Renew === Renew.Enabled;
    }
    return isPaidSubscription(subscription) ? subscription.Renew === Renew.Enabled : false;
};
