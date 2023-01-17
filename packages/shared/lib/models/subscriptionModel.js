import { getSubscription } from '../api/payments';
import updateObject from '../helpers/updateObject';
import formatSubscription from '../subscription/format';

/**
 * @param {*} api
 * @returns {Promise<import('../interfaces').SubscriptionModel>}
 */
export const getSubscriptionModel = (api) => {
    return api(getSubscription()).then(({ Subscription, UpcomingSubscription }) =>
        formatSubscription(Subscription, UpcomingSubscription)
    );
};

export const SubscriptionModel = {
    key: 'Subscription',
    get: getSubscriptionModel,
    update: (model, events) => {
        let eventsSubscription = updateObject(model, events);

        /**
         * There are two possible cases in the events: UpcomingSubscription created and UpcomingSubscription deleted.
         * This branch handles the deletion case, whereas {@link updateObject()} above handles the creation case.
         */
        if (!events.UpcomingSubscription) {
            delete eventsSubscription.UpcomingSubscription;
        }

        /**
         * In contrast to {@link getSubscriptionModel()}, events have a different structure for the
         * UpcomingSubscription. For example, {@link getSubscription()} endpoint returns the both properties on the top
         * level: { Subscription: { ... }, UpcomingSubscription: { ... }} Events make the upcoming subscription nested:
         * { Subscription: { UpcomingSubscription: { ... }, ...} }
         */
        return formatSubscription(eventsSubscription, eventsSubscription.UpcomingSubscription);
    },
};
