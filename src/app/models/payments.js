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
         * Route for events from payment providers (i.e. Stripe events like charge.success). Instead of accepting POST data, we will respond to the event by querying the API ourselves. The hook only acts as an asynchronous trigger.
         */
        // events: function(Obj) {
        //     return $http.post(url.get() + '/payments/events', Obj);
        // },
        /**
         * Get subscription information like plan configuration, billing cycle, period end etc. Returns a JSON.
         */
        status: function() {
            return $http.get(url.get() + '/payments/status', {
                params: {
                    ExternalProvider: 'Stripe'
                }
            });
        },
        /**
         *  Get payments corresponding to the given user.
         * @param {Integer} timestamp
         */
        user: function(timestamp) {
            return $http.get(url.get() + '/payments/user', {
                params: {
                    Time: timestamp
                }
            });
        },
        /**
         *  Get payments corresponding to the given organization.
         * @param {Integer} timestamp
         */
        organization: function(timestamp) {
            return $http.get(url.get() + '/payments/organization', {
                params: {
                    Time: timestamp
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
            return $http.get(url.get() + '/payments/sources', {
                params: {
                    ExternalProvider: 'Stripe'
                }
            });
        },
        /**
         * Send a new credit card information
         * @param {Object} Obj
         */
        change: function(Obj) {
            return $http.post(url.get() + '/payments/source', Obj);
        }
    };
})

.factory('Stripe', function ($window) {
    return $window.Stripe;
});
