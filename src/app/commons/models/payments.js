angular.module('proton.commons')
    .factory('Payment', ($http, authentication, url, brick, paymentPlansFormator) => {

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

        const getPayment = (params = {}) => {
            if (params.Payment) {
                return params.Payment;
            }

            if (params.PaymentMethod) {
                return params.PaymentMethod;
            }

            return params;
        };

        function generateFingerprint(params = {}) {
            const paymentMethodID = params.PaymentMethodID;
            // Faster accessor for the Object. We need to update the ref
            const payment = getPayment(params);

            return new Promise((resolve, reject) => {
                try {
                    if (typeof paymentMethodID === 'undefined' && payment.Type === 'card') {
                        return brick.getFingerprint((fingerprint) => {
                            payment.Fingerprint = fingerprint;
                            resolve(params);
                        });
                    }

                    resolve(params);
                } catch (e) {
                    reject(e);
                }
            });
        }


        /**
        * Credit account
        * @param {Object} Obj
        */
        const credit = (params) => {
            return generateFingerprint(params)
                .then((params) => $http.post(requestUrl('credit'), params));
        };

        /**
        * Donate for perks. Does not require authentication.
        * @param {Object} params
        */
        const donate = (params) => {
            return generateFingerprint(params)
                .then((params) => $http.post(requestUrl('donate'), params));
        };

        /**
        * Cancel given subscription.
        * @param {Object} Obj
        */
        const unsubscribe = (opt) => $http.post(requestUrl('unsubscribe'), opt);

        /**
         * Create Paypal Payment
         * @param {Object} params
         * @return {Promise}
         */
        const paypal = (opt) => $http.post(requestUrl('paypal'), opt);

        /**
         * Send payment details to subscribe during the signup process
         * @param {Object} params
         * @param {Promise}
         */
        const verify = (params) => {
            return generateFingerprint(params)
                .then((params) => $http.post(requestUrl('verify'), params));
        };

        /**
         * Get payment method status
         * @return {Promise}
         */
        const status = () => $http.get(requestUrl('status'));

        /**
         * Get invoices in reverse time order
         * @param {Object} params
         * @return {Promise}
         */
        const invoices = (params) => $http.get(requestUrl('invoices'), { params });

        /**
         * Get an invoice as pdf
         */
        const invoice = (id) => $http.get(requestUrl('invoices', id), { responseType: 'arraybuffer' });

        /**
         * Return information to pay invoice unpaid
         */
        const check = (id) => $http.post(requestUrl('invoices', id, 'check'));

        /**
          * Pay an unpaid invoice
          * @param {String} id
          * @param {Object} params
          * @return {Promise}
          */
        const pay = (id, params) => {
            return generateFingerprint(params)
                .then((params) => $http.post(requestUrl('invoices', id), params));
        };

        /**
         * Get plans available to user
         * @param {Function} filter callback to filter plans (default will remove vpn)
         */
        const plans = (Currency, Cycle) => {
            return $http.get(requestUrl('plans'), { params: { Currency, Cycle } })
                .then(paymentPlansFormator(Currency, Cycle))
                .then((data) => ({ data }));
        };

        /**
        * Get current subscription
        * @return {Promise}
        */
        const subscription = () => {
            if (authentication.user.Role > 1) {
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
            const sub = {
                Name: 'free',
                Title: 'ProtonMail Free',
                MaxDomains: 0,
                CouponCode: null,
                MaxAddresses: 1,
                MaxSpace: 5368709120, // 500 MB
                MaxMembers: 1,
                Cycle: 12,
                Currency: authentication.user.Currency
            };
            return Promise.resolve({
                data: {
                    Code: 1000,
                    Subscription: sub
                }
            });
        };

        /**
         * Validate a subscription
         */
        const valid = (opt) => $http.post(requestUrl('subscription', 'check'), opt);

        const updateMethod = (params) => {
            return generateFingerprint(params)
                .then((params) => $http.post(requestUrl('methods'), params));
        };

        const deleteMethod = (id) => $http.delete(requestUrl('methods', id));

        /**
         * Get payment methods in priority order
         */
        const methods = () => $http.get(requestUrl('methods'));

        /**
         * First will be charged for subscriptions
         */
        const order = (opt) => $http.post(requestUrl('methods', 'order'), opt);

        /**
         * Create a subscription
         */
        const subscribe = (params) => {
            return generateFingerprint(params)
                .then((params) => $http.post(requestUrl('subscription'), params));
        };

        /**
         * Delete current subscription, locked
         */
        const destroy = () => $http.delete(requestUrl('subscription'));

        /**
        *  Get payments corresponding to the given user.
        * @param {Integer} timestamp
        * @param {Integer} limit
        */
        const user = (Time, Limit) => {
            return $http.get(requestUrl('user'), {
                params: { Time, Limit },
                transformResponse: transformRepBillingCycle
            });
        };

        /**
        *  Get payments corresponding to the given organization.
        * @param {Integer} timestamp
        * @param {Integer} limit
        */
        const organization = (Time, Limit) => {
            return $http.get(requestUrl('organization'), {
                params: { Time, Limit },
                transformResponse: transformRepBillingCycle
            });
        };

        const btc = (Amount, Currency) => $http.post(requestUrl('bcinfo'), { Amount, Currency });

        return {
            credit, donate, paypal,
            invoices, invoice, order,
            verify, status, check, pay, valid,
            plans, subscription,
            updateMethod, deleteMethod, methods,
            subscribe, unsubscribe,
            delete: destroy,
            btc, organization, user
        };
    });
