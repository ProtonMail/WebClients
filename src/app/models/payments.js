angular.module("proton.models.payments", [])

.factory("Payment", function($http, url) {
    return {
        /**
         * Donate for perks. Does not require authentication.
         * @param {Object} Obj
         */
        donate: function(Obj) {
            return $http.post(url.get() + '/payments/donate', Obj);
        },
        /**
         * Subscription for a service given a subscription set up as Order JSON above.
         * @param {Object} Obj
         */
        subscribe: function(Obj) {
            return $http.post(url.get() + '/payments/subscribe', Obj);
        },
        /**
         * Cancel given subscription.
         * @param {Object} Obj
         */
        unsubscribe: function(Obj) {
            return $http.post(url.get() + '/payments/unsubscribe', Obj);
        },
        /**
         * Check the plan configured by the user to see if it's correct
         */
        plan: function(configuration) {
            return $http.post(url.get() + '/payments/plan', configuration);
        },
        /**
         * Get subscription information like plan configuration, billing cycle, period end etc. Returns a JSON.
         */
        status: function() {
            return $http.get(url.get() + '/payments/status');
        },
        /**
         * Call Stripe to get some information
         * @return {Promise}
         */
        subscriptions: function() {
            return $http.get(url.get() + '/payments/subscriptions');
        },
        /**
         *  Get payments corresponding to the given user.
         * @param {Integer} timestamp
         * @param {Integer} limit
         */
        user: function(timestamp, limit) {
            return $http.get(url.get() + '/payments/user', {
                params: {
                    Time: timestamp,
                    Limit: limit
                }
            });
        },
        /**
         *  Get payments corresponding to the given organization.
         * @param {Integer} timestamp
         * @param {Integer} limit
         */
        organization: function(timestamp, limit) {
            return $http.get(url.get() + '/payments/organization', {
                params: {
                    Time: timestamp,
                    Limit: limit
                }
            });
        },
        /**
         * Get payments corresponding to the given group.
         */
        group: function() {
            return $http.get(url.get() + '/payments/group');
        },
        /**
         * Get current payment information from Stripe
         */
        sources: function() {
            return $http.get(url.get() + '/payments/sources');
        },
        /**
         * Send a new credit card information
         * @param {Object} Obj
         */
        change: function(Obj) {
            return $http.put(url.get() + '/payments/sources', Obj);
        },
        delete: function(params) {
            return $http.delete(url.get() + '/payments/subscriptions', {params: params});
        }
    };
})

.factory('Stripe', function() {
    return window.Stripe;
});
