angular.module("proton.models.payments", [])

.factory("Payment", function($http, $q, $translate, CONSTANTS, url) {
    var stripeProxy;
    var proxy = function() {
        if (angular.isUndefined(stripeProxy)) {
            stripeProxy = new StripeProxy(CONSTANTS.STRIPE_ORIGIN, CONSTANTS.STRIPE_API_KEY);
        }

        return stripeProxy;
    };

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
            return $http.get(url.get() + '/payments/subscriptions', {
                transformResponse: function(data, headersGetter, status) {
                    data = angular.fromJson(data);

                    if (angular.isArray(data.Subscriptions) && data.Subscriptions.length > 0) {
                        data.Subscription = data.Subscriptions[0];

                        if (data.Subscription.Plan === 'free') {
                            data.Subscription.BillingCycle = 1;
                            data.Subscription.Amount = 0;
                            data.Subscription.Currency = 'CHF';
                        }
                    }

                    return data;
                }
            });
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
                },
                transformResponse: function(data, headersGetter, status) {
                    data = angular.fromJson(data);

                    if(angular.isDefined(data) && data.Code === 1000) {
                        var month = 60 * 60 * 24 * 30; // Time for a month in second

                        _.each(data.Payments, function(invoice) {
                            if(parseInt((invoice.PeriodEnd - invoice.PeriodStart) / month) === 1) {
                                invoice.BillingCycle = 12;
                            } else {
                                invoice.BillingCycle = 1;
                            }
                        });
                    }

                    return data;
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
                },
                transformResponse: function(data, headersGetter, status) {
                    data = angular.fromJson(data);

                    if (angular.isDefined(data) && data.Code === 1000) {
                        var month = 60 * 60 * 24 * 30; // Time for a month in second

                        _.each(data.Payments, function(invoice) {
                            if(parseInt((invoice.PeriodEnd - invoice.PeriodStart) / month) === 1) {
                                invoice.BillingCycle = 12;
                            } else {
                                invoice.BillingCycle = 1;
                            }
                        });
                    }

                    return data;
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
                transformResponse: function(data, headersGetter, status) {
                    data = angular.fromJson(data);

                    if (angular.isDefined(data) && data.Code === 1000) {
                        data.Source = data.Sources[0];
                    }

                    return data;
                }
            });
        },
        /**
        * Send a new credit card information
        * @param {Object} Obj
        */
        change: function(Obj) {
            return $http.put(url.get() + '/payments/sources', Obj);
        },
        /**
        * Apply coupon
        */
        coupons: function(coupon, params) {
            return $http.get(url.get() + '/payments/coupons/' + coupon, params);
        },
        /**
        * return the public key to encrypt the credit card information formatted
        */
        keys: function() {
            return $http.get(url.get() + '/payments/keys');
        },
        cardType: function(number) {
            return proxy().callSync('Stripe.card.cardType', number);
        },
        validateCardNumber: function(number) {
            var deferred = $q.defer();

            proxy().callSync('Stripe.card.validateCardNumber', number)
            .then(function(result) {
                if (result === false) {
                    deferred.reject(new Error($translate.instant('CARD_NUMER_INVALID')));
                } else {
                    deferred.resolve();
                }
            });

            return deferred.promise;
        },
        validateExpiry: function(month, year) {
            var deferred = $q.defer();

            proxy().callSync('Stripe.card.validateExpiry', month, year)
            .then(function(result) {
                if (result === false) {
                    deferred.reject(new Error($translate.instant('EXPIRY_INVALID')));
                } else {
                    deferred.resolve();
                }
            });

            return deferred.promise;
        },
        validateCVC: function(cvc) {
            var deferred = $q.defer();

            proxy().callSync('Stripe.card.validateCVC', cvc)
            .then(function(result) {
                if (result === false) {
                    deferred.reject(new Error($translate.instant('CVC_INVALID')));
                } else {
                    deferred.resolve();
                }
            });

            return deferred.promise;
        },
        createToken: function(params) {
            var deferred = $q.defer();

            proxy().callAsync('Stripe.card.createToken', params)
            .then(function(result) {
                if (angular.isDefined(result.error)) {
                    deferred.reject(result.error);
                } else {
                    deferred.resolve(result);
                }
            });

            return deferred.promise;
        }
    };
});
