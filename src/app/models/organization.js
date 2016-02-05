angular.module("proton.models.organization", [])

.factory("Organization", function($http, $q, url) {
    return {
        // POST
        /**
         * Create a new group of given parameters. Requires a subscription.
         */
        create: function(Obj) {
            return $http.post(url.get() + '/organizations', Obj);
        },
        //GET
        /**
         * Get group info: group name, token IDs, members (ids, names, roles, addresses, used space, space limit), domains (ids, names, verification status for MX, SPF, DKIM), usage and limits (for domains, members, addresses and space), billing info (status, billing cycle, next billing time). Only available for the group admin.
         * @param {Object}
         */
        get: function() {
            return $http.get(url.get() + '/organizations');
        },
        /**
         *
         */
        getKey: function() {
            return $http.get(url.get() + '/organizations/keys');
        },
        // PUT
        /**
         * Update group in a way that doesn't require a payment (name, billing cycle, tokens).
         */
        update: function(Obj) {
            return $http.put(url.get() + '/organizations', Obj);
        },
        /**
         * Update private key for the organization
         */
        private: function(Obj) {
            return $http.put(url.get() + '/organizations/keys/private', Obj);
        },
        /**
         * Update group in a way that requires a payment.
         */
        payment: function(Obj) {
            return $http.put(url.get() + '/organizations/payment', Obj);
        },
        // DELETE
        /**
         * Delete the group.
         */
        delete: function() {
            return $http.delete(url.get() + '/organizations', {
                transformResponse: function(data, headersGetter, status) {
                    data = angular.fromJson(data);

                    if (angular.isArray(data.Subscriptions) && data.Subscriptions.length > 0) {
                        data.Subscription = data.Subscriptions[0];
                        data.Subscription.Plan = 'free';
                        data.Subscription.BillingCycle = 1;
                        data.Subscription.Amount = 0;
                        data.Subscription.Currency = 'CHF';
                    }

                    return data;
                }
            });
        }
    };
});
