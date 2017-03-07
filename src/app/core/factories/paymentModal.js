angular.module('proton.core')
.factory('paymentModal', (
    notify,
    pmModal,
    organizationApi,
    gettextCatalog,
    eventManager,
    $log,
    $window,
    $q,
    Payment,
    authentication,
    networkActivityTracker,
    setupKeys,
    tools,
    CONSTANTS
) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/payment/modal.tpl.html',
        controller(params) {
            // Variables
            const self = this;
            self.choices = [];
            self.card = {};
            self.paypalNetworkError = false;
            self.paypalAccessError = false;
            self.displayCoupon = false;
            self.step = 'payment';
            self.methods = [];
            self.create = params.create;
            self.valid = params.valid;
            self.base = CONSTANTS.BASE_SIZE;
            self.coupon = '';
            self.childWindow = null;
            self.status = params.status;
            self.plans = _.chain(params.plans)
                .filter((plan) => { return params.planIDs.indexOf(plan.ID) !== -1; })
                .uniq()
                .value();
            self.organizationName = gettextCatalog.getString('My organization', null, 'Title'); // TODO set self value for the business plan

            // Functions
            function initialization() {
                if (params.subscription.CouponCode) {
                    self.displayCoupon = true;
                    self.coupon = params.subscription.CouponCode;
                    self.apply();
                }

                if (params.methods.length > 0) {
                    self.methods = params.methods;
                    self.method = self.methods[0];
                }

                if (params.status.Stripe === true) {
                    self.choices.push({ value: 'card', label: gettextCatalog.getString('Credit card', null) });
                }

                if (params.status.Paypal === true && !tools.isIE11) { // IE11 doesn't support PayPal
                    self.choices.push({ value: 'paypal', label: 'PayPal' });
                }

                self.choices.push({ value: 'bitcoin', label: 'Bitcoin' });
                self.choice = self.choices[0];

                if (angular.isDefined(params.choice)) {
                    self.choice = _.findWhere(self.choices, { value: params.choice });
                    self.changeChoice();
                }
            }

            /**
             * Generate key for the organization
             */
            function organizationKey() {
                if (params.create === true) {
                    return setupKeys.generateOrganization(authentication.getPassword())
                    .then((response) => {
                        const privateKey = response.privateKeyArmored;
                        return { PrivateKey: privateKey };
                    }, () => {
                        return Promise.reject(new Error('Error during the generation of new organization keys'));
                    });
                }
                return Promise.resolve();
            }
            /**
             * Create an organization
             */
            function createOrganization(parameters) {
                if (params.create === true) {
                    return organizationApi.create(parameters)
                    .then((result) => {
                        if (angular.isDefined(result.data) && result.data.Code === 1000) {
                            return Promise.resolve(result);
                        } else if (angular.isDefined(result.data) && angular.isDefined(result.data.Error)) {
                            return Promise.reject(result.data.Error);
                        }
                        return Promise.reject(gettextCatalog.getString('Error during organization request', null, 'Error'));
                    }, () => {
                        return Promise.reject(gettextCatalog.getString('Error during organization request', null, 'Error'));
                    });
                }
                return Promise.resolve();
            }

            function method() {
                if (self.methods.length === 0 && self.valid.AmountDue > 0) {
                    const { number, month, year, cvc, fullname, zip } = self.card;
                    const country = self.card.country.value;

                    // Add payment method
                    return Payment.updateMethod({
                        Type: 'card',
                        Details: {
                            Number: number,
                            ExpMonth: month,
                            ExpYear: (year.length === 2) ? '20' + year : year,
                            CVC: cvc,
                            Name: fullname,
                            Country: country,
                            ZIP: zip
                        }
                    }).then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            return Promise.resolve(result.data.PaymentMethod.ID);
                        } else if (result.data && result.data.Error) {
                            return Promise.reject(result.data.Error);
                        }
                    });
                } else if (self.valid.AmountDue > 0) {
                    return Promise.resolve(self.method.ID);
                }
                return Promise.resolve();
            }

            function subscribe(methodID) {
                return Payment.subscribe({
                    Amount: self.valid.AmountDue,
                    Currency: self.valid.Currency,
                    PaymentMethodID: methodID,
                    CouponCode: self.coupon,
                    PlanIDs: params.planIDs
                }).then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        return Promise.resolve(result.data);
                    } else if (result.data && result.data.Error) {
                        return Promise.reject(result.data.Error);
                    }
                    return Promise.reject('Error subscribing');
                });
            }

            function chargePaypal(paypalObject) {
                return Payment.subscribe({
                    Amount: self.valid.AmountDue,
                    Currency: params.valid.Currency,
                    CouponCode: self.coupon,
                    PlanIDs: params.planIDs,
                    Payment: {
                        Type: 'paypal',
                        Details: paypalObject
                    }
                }).then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        return Promise.resolve();
                    } else if (result.data && result.data.Error) {
                        return Promise.reject(result.data.Error);
                    }
                    return Promise.reject('Error connecting to PayPal.');
                });
            }

            function finish() {
                self.step = 'thanks';
                params.change();
            }

            self.label = (method) => ('•••• •••• •••• ' + method.Details.Last4);

            self.submit = () => {
                // Change process status true to disable input fields
                self.step = 'process';

                method()
                .then(subscribe)
                .then(organizationKey)
                .then(createOrganization)
                .then(eventManager.call)
                .then(finish)
                .catch((error) => {
                    notify({ message: error, classes: 'notification-danger' });
                    self.step = 'payment';
                });
            };

            self.count = (type) => {
                let count = 0;
                const plans = [];

                _.each(params.planIDs, (planID) => {
                    plans.push(_.findWhere(params.plans, { ID: planID }));
                });

                _.each(plans, (plan) => {
                    count += plan[type];
                });

                return count;
            };

            self.switch = (cycle, currency) => {
                params.switch(cycle, currency);
            };

            self.apply = () => {
                const promise = Payment.valid({
                    Currency: self.valid.Currency,
                    Cycle: self.valid.Cycle,
                    CouponCode: self.coupon,
                    PlanIDs: params.planIDs
                })
                .then(({ data = {} } = {}) => {
                    if (data.CouponDiscount === 0) {
                        self.coupon = '';
                        throw new Error(gettextCatalog.getString('Invalid coupon', null, 'Error'));
                    }
                    if (data.Error) {
                        throw new Error(data.Error);
                    }
                    if (data.Code === 1000) {
                        return Promise.resolve(data);
                    }
                })
                .then((data) => self.valid = data)
                .then(() => {
                    // If the amount due is null we select the first choice to display the submit button
                    if (!self.valid.AmountDue) {
                        return self.choice = self.choices[0];
                    }
                    // If the current payment method is 'paypal' we need to reload the Paypal link to match the new amount
                    if (self.choice.value === 'paypal') {
                        return self.initPaypal();
                    }
                    return Promise.resolve();
                })
                .then(() => notify({ message: gettextCatalog.getString('Coupon accepted', null, 'Info'), classes: 'notification-success' }));

                networkActivityTracker.track(promise);
            };

            self.changeChoice = () => {
                if (self.choice.value === 'paypal') {
                    if (self.valid.Cycle === 12) {
                        self.initPaypal();
                    } else if (self.valid.Cycle === 1) {
                        self.paypalAccessError = 1; // We only accept PayPal for annual subscriptions, click here to switch to an annual subscription. [Change Subscription]
                    }
                }
            };

            self.initPaypal = () => {
                self.approvalURL = false;
                self.paypalNetworkError = false;
                const promise = Payment.paypal({
                    Amount: self.valid.AmountDue,
                    Currency: self.valid.Currency
                }).then(({ data = {} } = {}) => {
                    if (data.Code === 1000) {
                        if (data.ApprovalURL) {
                            self.approvalURL = data.ApprovalURL;
                        }
                    } else if (data.Code === 22802) {
                        self.paypalNetworkError = true;
                    } else if (data.Error) {
                        throw new Error(data.Error);
                    }
                });
                return networkActivityTracker.track(promise);
            };

            /**
             * Open Paypal website in a new tab
             */
            self.openPaypalTab = () => {
                self.childWindow = window.open(self.approvalURL, 'PayPal');
                window.addEventListener('message', self.receivePaypalMessage, false);
            };

            self.receivePaypalMessage = (event) => {
                const origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.

                if (origin !== 'https://secure.protonmail.com') {
                    return;
                }

                const paypalObject = event.data;

                // we need to capitalize some stuff
                if (paypalObject.payerID && paypalObject.paymentID) {
                    paypalObject.PayerID = paypalObject.payerID;
                    paypalObject.PaymentID = paypalObject.paymentID;

                    // delete unused
                    delete paypalObject.payerID;
                    delete paypalObject.paymentID;
                }

                self.step = 'process';

                chargePaypal(paypalObject)
                .then(organizationKey)
                .then(createOrganization)
                .then(eventManager.call)
                .then(finish)
                .catch((error) => {
                    notify({ message: error, classes: 'notification-danger' });
                    self.step = 'payment';
                });

                self.childWindow.close();
                window.removeEventListener('message', self.receivePaypalMessage, false);
            };

            /**
             * Close payment modal
             */
            self.cancel = () => {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            initialization();
        }
    });
});
