angular.module("proton.models.payments", [])

.factory("Payment", function($http, $q, $translate, CONSTANTS, url) {
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
         * Get plans available to user
         */
        plans: function(currency, cycle) {
            return $http.get(url.get() + '/payments/plans', {
                params: {
                    Currency: currency,
                    Cycle: cycle
                },
                transformResponse: function(data, headersGetter, status) {
                    data = angular.fromJson(data);

                    if(angular.isDefined(data) && data.Code === 1000) {
                        // Add free plan
                        data.Plans.unshift({
                            Type: 1,
                            Name: 'free',
                            Title: 'ProtonMail Free',
                            Amount: 0,
                            MaxDomains: 0,
                            MaxAddresses: 1,
                            MaxSpace: 5368709120,
                            MaxMembers: 1,
                            TwoFactor: 0
                        });

                        _.each(data.Plans, function(plan) {
                            switch (plan.Name) {
                                case 'free':
                                    plan.editable = false;
                                    plan.display = true;
                                    break;
                                case 'plus':
                                    plan.editable = true;
                                    plan.display = true;
                                    break;
                                case 'business':
                                    plan.editable = true;
                                    plan.display = false;
                                    break;
                                case 'visionary':
                                    plan.editable = false;
                                    plan.display = true;
                                    break;
                                default:
                                    break;
                            }
                        });
                    }

                    return data;
                }
            });
        },
        /**
        * Get current subscription
        * @return {Promise}
        */
        subscription: function() {
            return $http.get(url.get() + '/payments/subscription', {
                transformResponse: function(data, headersGetter, status) {
                    data = angular.fromJson(data);

                    if (angular.isDefined(data) && data.Code === 1000) {
                        data.Subscription.Name = _.findWhere(data.Subscription.Plans, {Type: 1}).Name;
                        data.Subscription.Title = _.findWhere(data.Subscription.Plans, {Type: 1}).Title;
                    }

                    if (angular.isDefined(data) && data.Code === 22110) {
                        data.Code = 1000;
                        data.Subscription = {
                            Name: 'free',
                            Title: 'ProtonMail Free',
                            MaxDomains: 0,
                            MaxAddresses: 1,
                            MaxSpace: 5368709120, // 500 MB
                            MaxMembers: 1,
                            Cycle: 1,
                            Currency: 'USD'
                        };
                    }

                    return data;
                }
            });
        },
        /**
         * Validate a subscription
         */
        valid: function(params) {
            return $http.post(url.get() + '/payments/subscription/check', params);
        },
        /**
         * Create a subscription
         */
        create: function(params) {
            return $http.post(url.get() + '/payments/subscription', params);
        },
        /**
         * Update subscription, lockedPUT
         */
        update: function(params) {
            return $http.put(url.get() + '/payments/subscription', params);
        },
        /**
         * Delete current subscription, locked
         */
        delete: function() {
            return $http.delete(url.get() + '/payments/subscription');
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
            var deferred = $q.defer();

            deferred.resolve($.payment.cardType(number));

            return deferred.promise;
        },
        validateCardNumber: function(number) {
            var deferred = $q.defer();

            if ($.payment.validateCardNumber(number) === false) {
                deferred.reject(new Error($translate.instant('CARD_NUMER_INVALID')));
            } else {
                deferred.resolve();
            }

            return deferred.promise;
        },
        validateExpiry: function(month, year) {
            var deferred = $q.defer();

            if ($.payment.validateExpiry(month, year) === false) {
                deferred.reject(new Error($translate.instant('EXPIRY_INVALID')));
            } else {
                deferred.resolve();
            }

            return deferred.promise;
        },
        validateCVC: function(cvc) {
            var deferred = $q.defer();

            if ($.payment.validateCVC(cvc)) {
                deferred.reject(new Error($translate.instant('CVC_INVALID')));
            } else {
                deferred.resolve();
            }

            return deferred.promise;
        }
    };
});
