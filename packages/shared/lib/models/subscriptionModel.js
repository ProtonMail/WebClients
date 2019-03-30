import { getSubscription } from '../api/payments';
import updateObject from '../helpers/updateObject';

export const getSubscriptionModel = (api) => {
    return api(getSubscription()).then(({ Subscription }) => Subscription);
};

export const SubscriptionModel = {
    key: 'Subscription',
    get: getSubscriptionModel,
    update: updateObject
};
