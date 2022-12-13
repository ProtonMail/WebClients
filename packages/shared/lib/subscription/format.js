import { isManagedByMozilla } from './helpers';

const format = (subscription = {}, upcoming = undefined) => {
    // it covers the case when UpcomingSubscription arrives from the Events API. In this case UpcomingSubscription is a child of Subscription.
    // In case if it arrived through GET subscription then UpcomingSubscription is a sibling of Subscription
    if (!upcoming) {
        upcoming = subscription.UpcomingSubscription;
    }

    return {
        ...subscription,
        upcoming,
        isManagedByMozilla: isManagedByMozilla(subscription),
    };
};

export default format;
