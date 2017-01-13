angular.module('proton.organization')
.factory('subscriptionModel', (Payment) => {
    let subscription = {};
    function get() {
        return subscription;
    }
    function set(newSubscription = {}) {
        subscription = newSubscription;
    }
    function fetch() {
        return Payment.subscription()
        .then(({ data = {} } = {}) => {
            if (data.Code === 1000) {
                subscription = data.Subscription;
                return data.Subscription;
            }
            throw new Error(data.Error || 'Subscription request failed');
        });
    }
    return { set, get, fetch };
});
