angular.module('proton.core')
.factory('paymentModal', (
    notify,
    pmModal,
    Organization,
    gettextCatalog,
    eventManager,
    $log,
    $window,
    $q,
    Payment,
    authentication,
    pmcw,
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
                if (params.methods.length > 0) {
                    self.methods = params.methods;
                    self.method = self.methods[0];
                }

                if (params.status.Stripe === true) {
                    self.choices.push({ value: 'card', label: gettextCatalog.getString('Credit card', null) });
                }

                if (params.status.Paypal === true && ($.browser.msie !== true || $.browser.edge === true)) { // IE11 doesn't support PayPal
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
                    return pmcw.generateKeysRSA('pm_org_admin', authentication.getPassword())
                    .then((response) => {
                        const privateKey = response.privateKeyArmored;
                        return Promise.resolve({ PrivateKey: privateKey });
                    }, () => {
                        return Promise.reject('Error during the generation of new keys for pm_org_admin');
                    });
                }
                return Promise.resolve();
            }
            /**
             * Create an organization
             */
            function createOrganization(parameters) {
                if (params.create === true) {
                    return Organization.create(parameters)
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

            function validateCardNumber() {
                if (self.methods.length === 0 && self.valid.AmountDue > 0) {
                    return Payment.validateCardNumber(self.card.number);
                }
                return Promise.resolve();
            }

            function validateCardExpiry() {
                if (self.methods.length === 0 && self.valid.AmountDue > 0) {
                    return Payment.validateCardExpiry(self.card.month, self.card.year);
                }
                return Promise.resolve();
            }

            function validateCardCVC() {
                if (self.methods.length === 0 && self.valid.AmountDue > 0) {
                    return Payment.validateCardCVC(self.card.cvc);
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

                validateCardNumber()
                .then(validateCardExpiry)
                .then(validateCardCVC)
                .then(method)
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
                Payment.valid({
                    Currency: self.valid.Currency,
                    Cycle: self.valid.Cycle,
                    CouponCode: self.coupon,
                    PlanIDs: params.planIDs
                })
                .then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        if (result.data.CouponDiscount === 0) {
                            notify({ message: gettextCatalog.getString('Invalid coupon', null, 'Error'), classes: 'notification-danger' });
                            self.coupon = '';
                        } else {
                            notify({ message: gettextCatalog.getString('Coupon accepted', null, 'Info'), classes: 'notification-success' });
                        }
                        self.valid = result.data;
                    }
                });
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
                self.paypalNetworkError = false;

                Payment.paypal({
                    Amount: self.valid.AmountDue,
                    Currency: self.valid.Currency
                }).then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        if (result.data.ApprovalURL) {
                            self.approvalURL = result.data.ApprovalURL;
                        }
                    } else if (result.data.Code === 22802) {
                        self.paypalNetworkError = true;
                    } else if (result.data && result.data.Error) {
                        notify({ message: result.data.Error, classes: 'notification-danger' });
                    }
                });
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
