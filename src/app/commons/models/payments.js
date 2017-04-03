angular.module('proton.commons')
.factory('Payment', ($http, $q, authentication, url) => {

    const requestUrl = url.build('payments');
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
            return $http.post(requestUrl('credit'), Obj);
        },
        /**
        * Donate for perks. Does not require authentication.
        * @param {Object} Obj
        */
        donate(Obj) {
            return $http.post(requestUrl('donate'), Obj);
        },
        /**
        * Cancel given subscription.
        * @param {Object} Obj
        */
        unsubscribe(Obj) {
            return $http.post(requestUrl('unsubscribe'), Obj);
        },
        /**
         * Create Paypal Payment
         * @param {Object} params
         * @return {Promise}
         */
        paypal(params) {
            return $http.post(requestUrl('paypal'), params);
        },
        /**
         * Send payment details to subscribe during the signup process
         * @param {Object} params
         * @param {Promise}
         */
        verify(params) {
            return $http.post(requestUrl('verify'), params);
        },
        /**
         * Get payment method status
         * @return {Promise}
         */
        status() {
            return $http.get(requestUrl('status'));
        },
        /**
         * Get invoices in reverse time order
         * @param {Object} params
         * @return {Promise}
         */
        invoices(params) {
            return $http.get(requestUrl('invoices'), { params });
        },
        /**
         * Get an invoice as pdf
         */
        invoice(id) {
            return $http.get(requestUrl('invoices', id), { responseType: 'arraybuffer' });
        },
        /**
         * Return information to pay invoice unpaid
         */
        check(id) {
            return $http.post(requestUrl('invoices', id, 'check'));
        },
         /**
          * Pay an unpaid invoice
          * @param {String} id
          * @param {Object} params
          * @return {Promise}
          */
        pay(id, params) {
            return $http.post(requestUrl('invoices', id), params);
        },

        /**
         * Get plans available to user
         * @param {Function} filter callback to filter plans (default will remove vpn)
         */
        plans(params) {
            return $http.get(requestUrl('plans'), { params });
        },
        /**
        * Get current subscription
        * @return {Promise}
        */
        subscription() {
            if (authentication.user.Subscribed) {
                return $http.get(requestUrl('subscription'), {
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
                        CouponCode: null,
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
            return $http.post(requestUrl('subscription', 'check'), params);
        },
        updateMethod(params) {
            return $http.post(requestUrl('methods'), params);
        },
        deleteMethod(id) {
            return $http.delete(requestUrl('methods', id));
        },
        /**
         * Get payment methods in priority order
         */
        methods() {
            return $http.get(requestUrl('methods'));
        },
        /**
         * First will be charged for subscriptions
         */
        order(params) {
            return $http.post(requestUrl('methods', 'order'), params);
        },
        /**
         * Create a subscription
         */
        subscribe(params) {
            return $http.post(requestUrl('subscription'), params);
        },
        /**
         * Delete current subscription, locked
         */
        delete() {
            return $http.delete(requestUrl('subscription'));
        },
        /**
        *  Get payments corresponding to the given user.
        * @param {Integer} timestamp
        * @param {Integer} limit
        */
        user(Time, Limit) {
            return $http.get(requestUrl('user'), {
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
            return $http.get(requestUrl('organization'), {
                params: { Time, Limit },
                transformResponse: transformRepBillingCycle
            });
        },
        cardType(number) {
            const deferred = $q.defer();

            deferred.resolve($.payment.cardType(number));

            return deferred.promise;
        }
    };
});
