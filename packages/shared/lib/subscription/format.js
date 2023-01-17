import { isManagedByMozilla } from './helpers';

/**
 * @param {*} subscription
 * @param {*} [UpcomingSubscription]
 * @returns {import('../interfaces').SubscriptionModel}
 */
const format = (subscription = {}, UpcomingSubscription) => {
    return {
        ...subscription,
        UpcomingSubscription,
        isManagedByMozilla: isManagedByMozilla(subscription),
    };
};

export default format;
