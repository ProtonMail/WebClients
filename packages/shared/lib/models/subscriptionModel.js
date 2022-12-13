import { getSubscription } from '../api/payments';
import updateObject from '../helpers/updateObject';
import formatSubscription from '../subscription/format';

export const getSubscriptionModel = (api) => {
    return api(getSubscription()).then(({ Subscription, UpcomingSubscription }) =>
        formatSubscription(Subscription, UpcomingSubscription)
    );
};

export const SubscriptionModel = {
    key: 'Subscription',
    get: getSubscriptionModel,
    update: (model, events) => formatSubscription(updateObject(model, events)),
};
