angular.module('proton.core')
.factory('paymentModal', (
    notify,
    pmModal,
    Organization,
    gettextCatalog,
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
            this.choices = [];
            this.paypalNetworkError = false;
            this.paypalAccessError = false;
            this.displayCoupon = false;
            this.step = 'payment';
            this.methods = [];
            this.number = '';
            this.fullname = '';
            this.months = [];

            for (let i = 1; i <= 12; i++) {
                this.months.push(i);
            }

            this.month = this.months[0];
            this.years = [];

            for (let i = 0; i < 12; i++) {
                this.years.push(new Date().getFullYear() + i);
            }

            this.year = this.years[0];
            this.cvc = '';
            this.zip = '';
            this.create = params.create;
            this.valid = params.valid;
            this.base = CONSTANTS.BASE_SIZE;
            this.coupon = '';
            this.childWindow = null;
            this.countries = tools.countries;
            this.status = params.status;
            this.country = _.findWhere(this.countries, { value: 'US' });
            this.plans = _.chain(params.plans)
                .filter((plan) => { return params.planIDs.indexOf(plan.ID) !== -1; })
                .uniq()
                .value();
            this.organizationName = gettextCatalog.getString('My organization', null, 'Title'); // TODO set this value for the business plan

            // Functions
            const initialization = function () {
                if (params.methods.length > 0) {
                    this.methods = params.methods;
                    this.method = this.methods[0];
                }

                if (params.status.Stripe === true) {
                    this.choices.push({ value: 'card', label: gettextCatalog.getString('Credit card', null) });
                }

                if (params.status.Paypal === true && ($.browser.msie !== true || $.browser.edge === true)) { // IE11 doesn't support PayPal
                    this.choices.push({ value: 'paypal', label: 'PayPal' });
                }

                this.choices.push({ value: 'bitcoin', label: 'Bitcoin' });
                this.choice = this.choices[0];

                if (angular.isDefined(params.choice)) {
                    this.choice = _.findWhere(this.choices, { value: params.choice });
                    this.changeChoice();
                }
            }.bind(this);

            /**
             * Generate key for the organization
             */
            const organizationKey = function () {
                const deferred = $q.defer();

                if (params.create === true) {

                    pmcw.generateKeysRSA('pm_org_admin', authentication.getPassword())
                    .then((response) => {
                        const privateKey = response.privateKeyArmored;
                        deferred.resolve({
                            PrivateKey: privateKey
                        });
                    }, () => {
                        deferred.reject(new Error('Error during the generation of new keys for pm_org_admin'));
                    });
                } else {
                    deferred.resolve();
                }

                return deferred.promise;
            };
            /**
             * Create an organization
             */
            const createOrganization = function (parameters) {
                const deferred = $q.defer();

                if (params.create === true) {
                    Organization.create(parameters)
                    .then((result) => {
                        if (angular.isDefined(result.data) && result.data.Code === 1000) {
                            deferred.resolve(result);
                        } else if (angular.isDefined(result.data) && angular.isDefined(result.data.Error)) {
                            deferred.reject(new Error(result.data.Error));
                        } else {
                            deferred.reject(new Error(gettextCatalog.getString('Error during organization request', null, 'Error')));
                        }
                    }, () => {
                        deferred.reject(new Error(gettextCatalog.getString('Error during organization request', null, 'Error')));
                    });
                } else {
                    deferred.resolve();
                }

                return deferred.promise;
            };

            const validateCardNumber = function () {
                if (this.methods.length === 0 && this.valid.AmountDue > 0) {
                    return Payment.validateCardNumber(this.number);
                }

                return Promise.resolve();
            }.bind(this);

            const validateCardExpiry = function () {
                if (this.methods.length === 0 && this.valid.AmountDue > 0) {
                    return Payment.validateCardExpiry(this.month, this.year);
                }
                return Promise.resolve();
            }.bind(this);

            const validateCardCVC = function () {
                if (this.methods.length === 0 && this.valid.AmountDue > 0) {
                    return Payment.validateCardCVC(this.cvc);
                }
                return Promise.resolve();
            }.bind(this);

            const method = function () {
                const deferred = $q.defer();

                if (this.methods.length === 0 && this.valid.AmountDue > 0) {
                    const year = (this.year.length === 2) ? '20' + this.year : this.year;

                    // Add payment method
                    Payment.updateMethod({
                        Type: 'card',
                        Details: {
                            Number: this.number,
                            ExpMonth: this.month,
                            ExpYear: year,
                            CVC: this.cvc,
                            Name: this.fullname,
                            Country: this.country.value,
                            ZIP: this.zip
                        }
                    }).then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            deferred.resolve(result.data.PaymentMethod.ID);
                        } else if (result.data && result.data.Error) {
                            deferred.reject(new Error(result.data.Error));
                        }
                    });
                } else if (this.valid.AmountDue > 0) {
                    deferred.resolve(this.method.ID);
                } else {
                    deferred.resolve();
                }

                return deferred.promise;
            }.bind(this);

            const subscribe = function (methodID) {
                const deferred = $q.defer();

                Payment.subscribe({
                    Amount: this.valid.AmountDue,
                    Currency: this.valid.Currency,
                    PaymentMethodID: methodID,
                    CouponCode: this.coupon,
                    PlanIDs: params.planIDs
                }).then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        deferred.resolve();
                    } else if (result.data && result.data.Error) {
                        deferred.reject(new Error(result.data.Error));
                    }
                });

                return deferred.promise;
            }.bind(this);

            const chargePaypal = function (paypalObject) {
                const deferred = $q.defer();

                Payment.subscribe({
                    Amount: this.valid.AmountDue,
                    Currency: params.valid.Currency,
                    CouponCode: this.coupon,
                    PlanIDs: params.planIDs,
                    Payment: {
                        Type: 'paypal',
                        Details: paypalObject
                    }
                }).then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        deferred.resolve();
                    } else if (result.data && result.data.Error) {
                        deferred.reject(new Error(result.data.Error));
                    } else {
                        deferred.reject(new Error('Error connecting to PayPal.'));
                    }
                });

                return deferred.promise;
            }.bind(this);

            const finish = function () {
                this.step = 'thanks';
                params.change();
            }.bind(this);

            this.label = function (method) {
                return '•••• •••• •••• ' + method.Details.Last4;
            };

            this.submit = function () {
                // Change process status true to disable input fields
                this.step = 'process';

                validateCardNumber()
                .then(validateCardExpiry)
                .then(validateCardCVC)
                .then(method)
                .then(subscribe)
                .then(organizationKey)
                .then(createOrganization)
                .then(finish)
                .catch((error) => {
                    notify({ message: error, classes: 'notification-danger' });
                    this.step = 'payment';
                });
            }.bind(this);

            this.count = function (type) {
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

            this.switch = function (cycle, currency) {
                params.switch(cycle, currency);
            };

            this.apply = function () {
                Payment.valid({
                    Currency: this.valid.Currency,
                    Cycle: this.valid.Cycle,
                    CouponCode: this.coupon,
                    PlanIDs: params.planIDs
                })
                .then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        if (result.data.CouponDiscount === 0) {
                            notify({ message: gettextCatalog.getString('Invalid coupon', null, 'Error'), classes: 'notification-danger' });
                            this.coupon = '';
                        } else {
                            notify({ message: gettextCatalog.getString('Coupon accepted', null, 'Info'), classes: 'notification-success' });
                        }
                        this.valid = result.data;
                    }
                });
            }.bind(this);

            this.changeChoice = function () {
                if (this.choice.value === 'paypal') {
                    if (this.valid.Cycle === 12) {
                        this.initPaypal();
                    } else if (this.valid.Cycle === 1) {
                        this.paypalAccessError = 1; // We only accept PayPal for annual subscriptions, click here to switch to an annual subscription. [Change Subscription]
                    }
                }
            };

            this.initPaypal = function () {
                this.paypalNetworkError = false;

                Payment.paypal({
                    Amount: this.valid.AmountDue,
                    Currency: this.valid.Currency
                }).then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        if (result.data.ApprovalURL) {
                            this.approvalURL = result.data.ApprovalURL;
                        }
                    } else if (result.data.Code === 22802) {
                        this.paypalNetworkError = true;
                    } else if (result.data && result.data.Error) {
                        notify({ message: result.data.Error, classes: 'notification-danger' });
                    }
                });
            }.bind(this);

            /**
             * Open Paypal website in a new tab
             */
            this.openPaypalTab = function () {
                this.childWindow = window.open(this.approvalURL, 'PayPal');
                window.addEventListener('message', this.receivePaypalMessage, false);
            };

            this.receivePaypalMessage = function (event) {
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

                this.step = 'process';

                chargePaypal(paypalObject)
                .then(organizationKey)
                .then(createOrganization)
                .then(finish)
                .catch((error) => {
                    notify({ message: error, classes: 'notification-danger' });
                    this.step = 'payment';
                });

                this.childWindow.close();
                window.removeEventListener('message', this.receivePaypalMessage, false);
            }.bind(this);

            /**
             * Close payment modal
             */
            this.cancel = function () {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            initialization();
        }
    });
});
