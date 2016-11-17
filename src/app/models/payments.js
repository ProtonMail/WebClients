angular.module('proton.models.payments', [])

.factory('Payment', ($http, $q, gettextCatalog, authentication, CONSTANTS, url) => {

    const transformRepBillingCycle = (data) => {
        const json = angular.fromJson(data);

        if (json && json.Code === 1000) {
            const month = 60 * 60 * 24 * 30; // Time for a month in second

            _.each(json.Payments, (invoice) => {
                if (parseInt((invoice.PeriodEnd - invoice.PeriodStart) / month, 10) === 1) {
                    invoice.BillingCycle = 12;
                } else {
                    invoice.BillingCycle = 1;
                }
            });
        }

        return json || {};
    };

    return {
        /**
        * Credit account
        * @param {Object} Obj
        */
        credit(Obj) {
            return $http.post(url.get() + '/payments/credit', Obj);
        },
        /**
        * Donate for perks. Does not require authentication.
        * @param {Object} Obj
        */
        donate(Obj) {
            return $http.post(url.get() + '/payments/donate', Obj);
        },
        /**
        * Cancel given subscription.
        * @param {Object} Obj
        */
        unsubscribe(Obj) {
            return $http.post(url.get() + '/payments/unsubscribe', Obj);
        },
        /**
         * Create Paypal Payment
         * @param {Object} params
         * @return {Promise}
         */
        paypal(params) {
            return $http.post(url.get() + '/payments/paypal', params);
        },
        /**
         * Send payment details to subscribe during the signup process
         * @param {Object} params
         * @param {Promise}
         */
        verify(params) {
            return $http.post(url.get() + '/payments/verify', params);
        },
        /**
         * Get payment method status
         * @return {Promise}
         */
        status() {
            return $http.get(url.get() + '/payments/status');
        },
        /**
         * Get invoices in reverse time order
         * @param {Object} params
         * @return {Promise}
         */
        invoices(params) {
            return $http.get(url.get() + '/payments/invoices', { params });
        },
        /**
         * Get an invoice as pdf
         */
        invoice(id) {
            return $http.get(url.get() + '/payments/invoices/' + id, { responseType: 'arraybuffer' });
        },
        /**
         * Return information to pay invoice unpaid
         */
        check(id) {
            return $http.post(url.get() + '/payments/invoices/' + id + '/check');
        },
         /**
          * Pay an unpaid invoice
          * @param {String} id
          * @param {Object} params
          * @return {Promise}
          */
        pay(id, params) {
            return $http.post(url.get() + '/payments/invoices/' + id, params);
        },

        /**
         * Get plans available to user
         */
        plans(Currency, Cycle) {
            const transformResponse = (data) => {
                const json = angular.fromJson(data);

                if (json && json.Code === 1000) {
                    // Add free plan
                    json.Plans.unshift({
                        Type: 1,
                        Cycle,
                        Currency,
                        Name: 'free',
                        Title: 'Free',
                        Amount: 0,
                        MaxDomains: 0,
                        MaxAddresses: 1,
                        MaxSpace: 500 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE,
                        MaxMembers: 1,
                        TwoFactor: 0
                    });

                    if (CONSTANTS.KEY_PHASE <= 3) {
                        json.Plans = json.Plans.filter(({ Name }) => Name !== 'business' && Name !== 'vpnbasic' && Name !== 'vpnplus');
                    }

                    json.Plans.forEach((plan) => {
                        switch (plan.Name) {
                            case 'free':
                                plan.editable = false;
                                plan.display = true;
                                plan.sending = '150 ' + gettextCatalog.getString('Messages per day', null);
                                plan.labels = '20 ' + gettextCatalog.getString('Labels', null);
                                plan.support = gettextCatalog.getString('Limited support', null);
                                break;
                            case 'plus':
                                plan.editable = true;
                                plan.display = true;
                                plan.sending = '1000 ' + gettextCatalog.getString('Messages per day', null);
                                plan.labels = '200 ' + gettextCatalog.getString('Labels', null);
                                plan.support = gettextCatalog.getString('Support', null);
                                break;
                            case 'business':
                                plan.editable = true;
                                plan.display = false;
                                plan.sending = '???';
                                plan.labels = '???';
                                plan.support = '???';
                                break;
                            case 'visionary':
                                plan.editable = false;
                                plan.display = true;
                                plan.sending = gettextCatalog.getString('Unlimited sending', null);
                                plan.labels = gettextCatalog.getString('Unlimited labels', null);
                                plan.support = gettextCatalog.getString('Priority support', null);
                                break;
                            case 'vpnbasic':
                            case 'vpnplus':
                                plan.editable = false;
                                plan.display = false;
                                plan.sending = '150 ' + gettextCatalog.getString('Messages per day', null);
                                plan.labels = '20 ' + gettextCatalog.getString('Labels', null);
                                plan.support = gettextCatalog.getString('Support', null);
                                break;
                            default:
                                break;
                        }
                    });
                }

                return json;
            };

            return $http
                .get(url.get() + '/payments/plans', {
                    params: { Currency, Cycle },
                    transformResponse
                });
        },
        /**
        * Get current subscription
        * @return {Promise}
        */
        subscription() {
            if (authentication.user.Subscribed) {
                return $http.get(url.get() + '/payments/subscription', {
                    transformResponse(datas) {
                        const json = angular.fromJson(datas);

                        if (json && json.Code === 1000) {
                            const { Name, Title } = _.findWhere(json.Subscription.Plans, { Type: 1 }) || {};
                            json.Subscription.Name = Name;
                            json.Subscription.Title = Title;
                        }

                        return json || {};
                    }
                });
            }
            return Promise.resolve({
                data: {
                    Code: 1000,
                    Subscription: {
                        Name: 'free',
                        Title: 'ProtonMail Free',
                        MaxDomains: 0,
                        MaxAddresses: 1,
                        MaxSpace: 5368709120, // 500 MB
                        MaxMembers: 1,
                        Cycle: 12,
                        Currency: authentication.user.Currency
                    }
                }
            });
        },
        /**
         * Validate a subscription
         */
        valid(params) {
            return $http.post(url.get() + '/payments/subscription/check', params);
        },
        updateMethod(params) {
            return $http.post(url.get() + '/payments/methods', params);
        },
        deleteMethod(id) {
            return $http.delete(url.get() + '/payments/methods/' + id);
        },
        /**
         * Get payment methods in priority order
         */
        methods() {
            return $http.get(url.get() + '/payments/methods');
        },
        /**
         * First will be charged for subscriptions
         */
        order(params) {
            return $http.post(url.get() + '/payments/methods/order', params);
        },
        /**
         * Create a subscription
         */
        subscribe(params) {
            return $http.post(url.get() + '/payments/subscription', params);
        },
        /**
         * Delete current subscription, locked
         */
        delete() {
            return $http.delete(url.get() + '/payments/subscription');
        },
        /**
        *  Get payments corresponding to the given user.
        * @param {Integer} timestamp
        * @param {Integer} limit
        */
        user(Time, Limit) {
            return $http.get(url.get() + '/payments/user', {
                params: { Time, Limit },
                transformResponse: transformRepBillingCycle
            });
        },
        /**
        *  Get payments corresponding to the given organization.
        * @param {Integer} timestamp
        * @param {Integer} limit
        */
        organization(Time, Limit) {
            return $http.get(url.get() + '/payments/organization', {
                params: { Time, Limit },
                transformResponse: transformRepBillingCycle
            });
        },
        cardType(number) {
            const deferred = $q.defer();

            deferred.resolve($.payment.cardType(number));

            return deferred.promise;
        },
        validateCardNumber(number) {
            const deferred = $q.defer();

            if ($.payment.validateCardNumber(number) === false) {
                deferred.reject(new Error(gettextCatalog.getString('Card number invalid', null, 'Error')));
            } else {
                deferred.resolve();
            }

            return deferred.promise;
        },
        validateCardExpiry(month, year) {
            const deferred = $q.defer();

            if ($.payment.validateCardExpiry(month, year) === false) {
                deferred.reject(new Error(gettextCatalog.getString('Expiration date invalid', null, 'Error')));
            } else {
                deferred.resolve();
            }

            return deferred.promise;
        },
        validateCardCVC(cvc) {
            const deferred = $q.defer();

            if ($.payment.validateCardCVC(cvc) === false) {
                deferred.reject(new Error(gettextCatalog.getString('CVC invalid', null, 'Error')));
            } else {
                deferred.resolve();
            }

            return deferred.promise;
        }
    };
});
