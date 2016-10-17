angular.module('proton.modals', [])

.factory('pmModal', (
    $animate,
    $compile,
    $rootScope,
    $controller,
    $q,
    $http,
    $templateCache
) => {
    return function modalFactory(config) {
        if (!(!config.template ^ !config.templateUrl)) {
            throw new Error('Expected modal to have exacly one of either template or templateUrl');
        }

        const controller = config.controller || null;
        const controllerAs = config.controllerAs;
        const container = angular.element(config.container || document.body);
        let element = null;
        let html;
        let scope;

        if (config.template) {
            html = $q.when(config.template);
        } else {
            html = $http.get(config.templateUrl, {
                cache: $templateCache
            }).then(({ data }) => data);
        }

        function activate(locals) {
            return html.then((html) => {
                if (!element) {
                    attach(html, locals);
                }
                $('#body').append('<div class="modal-backdrop fade in"></div>');
                $rootScope.modalOpen = true;
                setTimeout(() => {
                    $('.modal').addClass('in');
                    window.scrollTo(0, 0);
                    Mousetrap.bind('escape', () => deactivate());
                }, 100);
            });
        }

        function attach(html, locals) {
            element = angular.element(html);
            if (element.length === 0) {
                throw new Error('The template contains no elements; you need to wrap text nodes');
            }
            scope = $rootScope.$new();
            if (controller) {
                if (!locals) {
                    /* eslint  { "no-param-reassign": "off"} */
                    locals = {};
                }
                locals.$scope = scope;
                const ctrl = $controller(controller, locals);
                if (controllerAs) {
                    scope[controllerAs] = ctrl;
                }
            } else if (locals) {
                /* eslint  { "guard-for-in": "off", "no-restricted-syntax": "off"} */
                for (const prop in locals) {
                    scope[prop] = locals[prop];
                }
            }
            $compile(element)(scope);
            return $animate.enter(element, container);
        }

        function deactivate() {
            if (!element) {
                return $q.when();
            }
            return $animate.leave(element).then(() => {
                Mousetrap.unbind('escape');
                scope.$destroy();
                scope = null;
                element.remove();
                element = null;
                $rootScope.modalOpen = false;
                $('.modal-backdrop').remove();
            });
        }

        function active() {
            return !!element;
        }

        return {
            activate,
            deactivate,
            active
        };
    };
})

// confirm modal
.factory('confirmModal', (pmModal) => {
    return pmModal({
        controller(params) {
            this.message = params.message;
            this.title = params.title;

            Mousetrap.bind('enter', () => {
                this.confirm();

                return false;
            });

            this.confirm = function () {
                Mousetrap.unbind('enter');
                params.confirm();
            };

            this.cancel = function () {
                Mousetrap.unbind('enter');
                params.cancel();
            };
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/confirm.tpl.html'
    });
})

// alert modal
.factory('alertModal', (pmModal) => {
    return pmModal({
        controller(params) {
            this.title = params.title;
            this.message = params.message;
            this.alert = params.alert || 'alert-info';

            this.ok = function () {
                params.ok();
            };
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/alert.tpl.html'
    });
})

// login help modal
.factory('loginModal', (pmModal) => {
    return pmModal({
        controller(params) {
            this.cancel = function () {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/loginHelp.tpl.html'
    });
})

// contact modal
.factory('contactModal', (pmModal) => {
    return pmModal({
        controller(params, $timeout) {
            this.name = params.name;
            this.email = params.email;
            this.title = params.title;

            this.save = function () {
                if (angular.isDefined(params.save) && angular.isFunction(params.save)) {
                    params.save(this.name, this.email);
                }
            };

            this.cancel = function () {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            $timeout(() => {
                $('#contactName').focus();
            }, 100);
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/contact.tpl.html'
    });
})

// label modal
.factory('labelModal', (pmModal, tools) => {
    return pmModal({
        controller(params, $timeout) {
            this.title = params.title;
            this.colors = tools.colors();

            if (angular.isDefined(params.label)) {
                this.name = params.label.Name;
                this.color = params.label.Color;
            } else {
                this.name = '';
                this.color = this.colors[0];
            }

            this.create = function () {
                if (angular.isDefined(params.create) && angular.isFunction(params.create)) {
                    params.create(this.name, this.color);
                }
            };

            this.cancel = function () {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            $timeout(() => {
                angular.element('#labelName').focus();
            }, 100);
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/label.tpl.html'
    });
})

// dropzone modal
.factory('dropzoneModal', (pmModal) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/dropzone.tpl.html',
        controller(params, notify, $timeout) {
            let files = [];
            let extension;
            const self = this;

            function init() {
                const drop = document.getElementById('dropzone');

                drop.ondrop = function (e) {
                    e.preventDefault();
                    extension = e.dataTransfer.files[0].name.substr(e.dataTransfer.files[0].name.length - 4);

                    if (extension !== '.csv' && extension !== '.vcf') {
                        notify('Invalid file type');
                        self.hover = false;
                    } else {
                        files = e.dataTransfer.files;
                        self.fileDropped = files[0].name;
                        self.hover = false;
                    }
                };

                drop.ondragover = function (event) {
                    event.preventDefault();
                    self.hover = true;
                };

                drop.ondragleave = function (event) {
                    event.preventDefault();
                    self.hover = false;
                };

                $('#dropzone').on('click', () => {
                    $('#selectedFile').trigger('click');
                });

                $('#selectedFile').change(() => {
                    extension = $('#selectedFile')[0].files[0].name.substr($('#selectedFile')[0].files[0].name.length - 4);

                    if (extension !== '.csv' && extension !== '.vcf') {
                        notify('Invalid file type');
                    } else {
                        files = $('#selectedFile')[0].files;
                        self.fileDropped = $('#selectedFile')[0].files[0].name;
                        self.hover = false;
                    }
                });
            }

            this.import = function () {
                params.import(files);
            };

            this.cancel = function () {
                params.cancel();
            };

            $timeout(() => {
                init();
            }, 100);
        }
    });
})

// Card modal
.factory('cardModal', (pmModal, Payment, notify, pmcw, tools, gettextCatalog, $q, networkActivityTracker) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/card.tpl.html',
        controller(params) {
            // Variables
            this.countries = tools.countries;
            this.cardChange = false;
            this.process = false;

            if (angular.isDefined(params.method)) {
                this.text = 'Update your credit card information.';
                this.number = '•••• •••• •••• ' + params.method.Details.Last4;
                this.fullname = params.method.Details.Name;
                this.month = params.method.Details.ExpMonth;
                this.year = params.method.Details.ExpYear;
                this.cvc = '•••';
                this.zip = params.method.Details.ZIP;
                this.country = _.findWhere(this.countries, { value: params.method.Details.Country });
            } else {
                this.text = 'Add a credit card.';
                this.number = '';
                this.fullname = '';
                this.month = '';
                this.year = '';
                this.cvc = '';
                this.zip = '';
                this.country = _.findWhere(this.countries, { value: 'US' });
            }

            // Functions
            const validateCardNumber = function () {
                if (this.cardChange === true) {
                    return Payment.validateCardNumber(this.number);
                }
                return Promise.resolve();
            }.bind(this);

            const validateCardExpiry = function () {
                if (this.cardChange === true) {
                    return Payment.validateCardExpiry(this.month, this.year);
                }
                return Promise.resolve();
            }.bind(this);

            const validateCardCVC = function () {
                if (this.cardChange === true) {
                    return Payment.validateCardCVC(this.cvc);
                }
                return Promise.resolve();
            }.bind(this);

            const method = function () {
                const deferred = $q.defer();

                if (this.cardChange === true) {
                    const year = (this.year.length === 2) ? '20' + this.year : this.year;

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
                            deferred.resolve(result.data.PaymentMethod);
                        } else if (result.data && result.data.Error) {
                            deferred.reject(new Error(result.data.Error));
                        }
                    });
                } else {
                    deferred.resolve();
                }

                return deferred.promise;
            }.bind(this);

            const finish = function (method) {
                params.close(method);
            };

            this.submit = function () {
                this.process = true;

                networkActivityTracker.track(
                    validateCardNumber()
                    .then(validateCardExpiry)
                    .then(validateCardCVC)
                    .then(method)
                    .then(finish)
                    .catch((error) => {
                        notify({ message: error, classes: 'notification-danger' });
                        this.process = false;
                    })
                );
            };

            this.cancel = function () {
                params.close();
            };
        }
    });
})

.factory('loginPasswordModal', ($timeout, pmModal) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/loginPassword.tpl.html',
        controller(params) {
            this.loginPassword = '';
            this.twoFactorCode = '';
            this.hasTwoFactor = params.hasTwoFactor;
            $timeout(() => {
                $('#loginPassword').focus();
            });

            this.submit = function () {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit(this.loginPassword, this.twoFactorCode);
                }
            }.bind(this);

            this.cancel = function () {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

.factory('reactivateModal', (pmModal) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/reactivate.tpl.html',
        controller(params) {
            this.loginPassword = '';
            this.keyPassword = '';

            /**
             * Submit password
             */
            this.submit = function () {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit(this.loginPassword, this.keyPassword);
                }
            }.bind(this);

            /**
             * Close modal
             */
            this.cancel = function () {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

.factory('payModal', (pmModal, Payment, notify, eventManager, gettextCatalog) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/pay.tpl.html',
        controller(params) {
            // Variables
            this.amount = params.amount;
            this.amountDue = params.amountDue;
            this.credit = params.credit;
            this.currency = params.currency;
            this.methods = params.methods;
            this.invoice = params.invoice;
            this.choices = [];

            // Functions
            this.initialization = function () {
                if (this.amountDue > 0) {
                    if (params.status.Stripe === true && this.methods.length > 0) {
                        this.method = this.methods[0];
                        this.choices.push({ value: 'card', label: gettextCatalog.getString('Credit card', null) });
                    }

                    if (params.status.Paypal === true && ($.browser.msie !== true || $.browser.edge === true)) { // IE11 doesn't support PayPal
                        this.choices.push({ value: 'paypal', label: 'PayPal' });
                    }

                    if (this.choices.length > 0) {
                        this.choice = this.choices[0];
                        this.changeChoice();
                    }
                }
            }.bind(this);

            this.label = function (method) {
                return '•••• •••• •••• ' + method.Details.Last4;
            };

            this.submit = function () {
                const parameters = {
                    Amount: params.amountDue,
                    Currency: params.currency
                };

                if (this.amountDue > 0 && this.choice.value === 'card' && this.methods.length > 0) {
                    parameters.PaymentMethodID = this.method.ID;
                }

                Payment.pay(params.invoice.ID, parameters)
                .then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        // manually fetch event log
                        eventManager.call();
                        params.close(true);
                    } else if (result.data && result.data.Error) {
                        notify({ message: result.data.Error, classes: 'notification-danger' });
                    }
                });
            }.bind(this);

            this.cancel = function () {
                params.close();
            };

            this.changeChoice = function () {
                if (this.choice.value === 'paypal') {
                    this.initPaypal();
                }
            };

            this.initPaypal = function () {
                Payment.paypal({
                    Amount: params.amountDue,
                    Currency: params.currency
                }).then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        this.approvalURL = result.data.ApprovalURL;
                    } else if (result.data && result.data.Error) {
                        notify({ message: result.data.Error, classes: 'notification-danger' });
                    }
                });
            }.bind(this);

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

                paypalObject.PayerID = paypalObject.payerID;
                paypalObject.PaymentID = paypalObject.paymentID;
                delete paypalObject.payerID;
                delete paypalObject.paymentID;

                Payment.pay(params.invoice.ID, {
                    Amount: params.amountDue,
                    Currency: params.currency,
                    Payment: {
                        Type: 'paypal',
                        Details: paypalObject
                    }
                }).then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        eventManager.call();
                        params.close(true);
                    } else if (result.data && result.data.Error) {
                        notify({ message: result.data.Error, classes: 'notification-danger' });
                    }
                });

                this.childWindow.close();
                window.removeEventListener('message', this.receivePaypalMessage, false);
            }.bind(this);

            this.initialization();
        }
    });
})

// Payment modal
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
            this.month = '';
            this.year = '';
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
})

.factory('memberModal', (pmModal, CONSTANTS, gettextCatalog, Member, $q, networkActivityTracker, notify, pmcw, MemberKey, authentication, Address) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/member.tpl.html',
        controller(params) {
            // Variables
            const base = CONSTANTS.BASE_SIZE;

            // Default Parameters
            this.ID = null;
            this.step = 'member';
            this.size = 2048;
            this.organization = params.organization;
            this.organizationPublicKey = params.organizationPublicKey;
            this.domains = params.domains;
            this.domain = params.domains[0];
            this.name = '';
            this.temporaryPassword = '';
            this.confirmPassword = '';
            this.address = '';
            this.quota = 0;
            this.units = [
                { label: 'MB', value: base * base },
                { label: 'GB', value: base * base * base }
            ];
            this.unit = this.units[0];
            this.private = true;

            // Edit mode
            if (params.member) {
                this.ID = params.member.ID;
                this.name = params.member.Name;
                this.private = Boolean(params.member.Private);
                this.isPrivate = Boolean(params.member.Private);
                this.quota = params.member.MaxSpace / this.unit.value;
            }

            // Functions
            this.submit = function () {
                let mainPromise;
                let address;
                let notificationMessage;
                let member = {
                    Name: this.name,
                    Private: this.private ? 1 : 0,
                    MaxSpace: this.quota * this.unit.value
                };

                const check = function () {
                    const deferred = $q.defer();
                    let error;

                    if (this.name.length === 0) {
                        error = gettextCatalog.getString('Invalid Name', null, 'Error');
                        deferred.reject(error);
                    } else if (!member.ID && this.temporaryPassword !== this.confirmPassword) {
                        error = gettextCatalog.getString('Invalid Password', null, 'Error');
                        deferred.reject(error);
                    } else if (!member.ID && this.address.length === 0) {
                        error = gettextCatalog.getString('Invalid Address', null, 'Error');
                        deferred.reject(error);
                    } else if (this.quota * this.unit.value > (this.organization.MaxSpace - this.organization.UsedSpace)) {
                        error = gettextCatalog.getString('Invalid Quota', null, 'Error');
                        deferred.reject(error);
                    } else {
                        deferred.resolve();
                    }

                    return deferred.promise;
                }.bind(this);

                const updateName = function () {
                    const deferred = $q.defer();

                    Member.name(member.ID, this.name)
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            deferred.resolve();
                        } else if (result.data && result.data.Error) {
                            deferred.reject(result.data.Error);
                        } else {
                            deferred.reject('Request error');
                        }
                    });

                    return deferred.promise;
                }.bind(this);

                const updateQuota = function () {
                    const deferred = $q.defer();

                    Member.quota(member.ID, this.quota * this.unit.value)
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            deferred.resolve();
                        } else if (result.data && result.data.Error) {
                            deferred.reject(result.data.Error);
                        } else {
                            deferred.reject('Request error');
                        }
                    });

                    return deferred.promise;
                }.bind(this);

                const updatePrivate = function () {
                    const deferred = $q.defer();

                    if (this.private) {
                        Member.private(member.ID, this.quota * this.unit.value)
                        .then((result) => {
                            if (result.data && result.data.Code === 1000) {
                                deferred.resolve();
                            } else if (result.data && result.data.Error) {
                                deferred.reject(result.data.Error);
                            } else {
                                deferred.reject('Request error');
                            }
                        });
                    } else {
                        deferred.resolve();
                    }

                    return deferred.promise;
                }.bind(this);

                const memberRequest = function () {
                    const deferred = $q.defer();
                    const request = member.ID ? Member.update(member) : Member.create(member);

                    request.then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            member = result.data.Member;
                            deferred.resolve();
                        } else if (result.data && result.data.Error) {
                            deferred.reject(result.data.Error);
                        } else {
                            deferred.reject('Request error');
                        }
                    });

                    return deferred.promise;
                };

                const addressRequest = function () {
                    const deferred = $q.defer();

                    Address.create({ Local: this.address, Domain: this.domain.DomainName, MemberID: member.ID })
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            address = result.data.Address;
                            deferred.resolve();
                        } else if (result.data && result.data.Error) {
                            deferred.reject(result.data.Error);
                        } else {
                            deferred.reject('Request error');
                        }
                    });

                    return deferred.promise;
                }.bind(this);

                const generateKey = function () {
                    const password = this.temporaryPassword;
                    const numBits = this.size;
                    const randomString = authentication.randomString(24);
                    const organizationKey = this.organizationPublicKey;

                    return pmcw.generateKeysRSA(address.Email, password, numBits)
                    .then((result) => {
                        const userKey = result.privateKeyArmored;

                        return pmcw.decryptPrivateKey(userKey, password)
                        .then((result) => {
                            return pmcw.encryptPrivateKey(result, randomString)
                            .then((memberKey) => {
                                return pmcw.encryptMessage(randomString, organizationKey)
                                .then((token) => {
                                    return Promise.resolve({
                                        userKey,
                                        memberKey,
                                        token
                                    });
                                });
                            });
                        });
                    });
                }.bind(this);

                const keyRequest = function (result) {
                    return MemberKey.create({
                        AddressID: address.ID,
                        UserKey: result.userKey,
                        MemberKey: result.memberKey,
                        Token: result.token
                    })
                    .then(({ data = {} }) => {
                        if (data.Code === 1000) {
                            return Promise.resolve();
                        }
                        return Promise.reject(data.Error || 'Request error');
                    });
                };

                const finish = function () {
                    notify({ message: notificationMessage, classes: 'notification-success' });
                    params.cancel(member);
                };

                const error = function (error) {
                    notify({ message: error, classes: 'notification-danger' });
                };

                if (this.ID) {
                    member.ID = this.ID;
                    notificationMessage = gettextCatalog.getString('Member updated', null, 'Notification');
                    mainPromise = check()
                    .then(updateName)
                    .then(updateQuota)
                    .then(updatePrivate)
                    .then(finish)
                    .catch(error);
                } else {
                    member.Password = this.temporaryPassword;
                    notificationMessage = gettextCatalog.getString('Member created', null, 'Notification');

                    if (member.Private === 0) {
                        mainPromise = check()
                        .then(memberRequest)
                        .then(addressRequest)
                        .then(generateKey)
                        .then(keyRequest)
                        .then(finish)
                        .catch(error);
                    } else {
                        mainPromise = check()
                        .then(memberRequest)
                        .then(addressRequest)
                        .then(finish)
                        .catch(error);
                    }
                }

                networkActivityTracker.track(mainPromise);
            }.bind(this);

            this.cancel = function () {
                params.cancel();
            };
        }
    });
})

.factory('buyDomainModal', (pmModal) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/buy.tpl.html',
        controller(params) {
            // Functions
            this.submit = function () {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit();
                }
            };

            this.cancel = function () {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

.factory('addressModal', (pmModal, authentication, $rootScope, $state, $q, networkActivityTracker, notify, Address, gettextCatalog, eventManager, pmcw, Key, MemberKey) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/address.tpl.html',
        controller(params) {
            // Variables
            const { domain, organizationPublicKey, step, members = [] } = params;

            this.domain = domain;
            this.organizationPublicKey = organizationPublicKey;
            this.step = step;
            this.address = '';
            this.password = '';
            this.size = 2048;
            this.members = members;
            this.member = members[0];

            this.open = (name) => {
                $rootScope.$broadcast(name, params.domain);
            };

            // Functions
            this.add = function () {
                networkActivityTracker.track(
                    Address.create({ Local: this.address, Domain: this.domain.DomainName, MemberID: this.member.ID })
                    .then((result) => {
                        if (angular.isDefined(result.data) && result.data.Code === 1000) {
                            const address = result.data.Address;
                            const password = this.password;
                            const numBits = this.size;

                            const generate = function () {
                                const randomString = authentication.randomString(24);

                                return $q.all({
                                    userKey: pmcw.generateKeysRSA(address.Email, password, numBits),
                                    memberKey: pmcw.generateKeysRSA(address.Email, randomString, numBits),
                                    token: pmcw.encryptMessage(randomString, this.organizationPublicKey)
                                });
                            }.bind(this);

                            const keyRequest = function (result) {
                                const deferred = $q.defer();

                                MemberKey.create({
                                    AddressID: address.ID,
                                    UserKey: result.userKey.privateKeyArmored,
                                    MemberKey: result.memberKey,
                                    Token: result.token
                                })
                                .then((result) => {
                                    if (result.data && result.data.Code === 1000) {
                                        deferred.resolve();
                                    } else if (result.data && result.data.Error) {
                                        deferred.reject(result.data.Error);
                                    } else {
                                        deferred.reject('Request error');
                                    }
                                });

                                return deferred.promise;
                            };

                            const finish = function () {
                                notify({ message: gettextCatalog.getString('Address added', null, 'Info'), classes: 'notification-success' });
                                this.domain.Addresses.push(address);

                                return eventManager.call();
                            }.bind(this);

                            if (this.member.Private === 0) {
                                return generate()
                                    .then(keyRequest)
                                    .then(finish);
                            }
                            return finish();

                        } else if (angular.isDefined(result.data) && result.data.Code === 31006) {
                            notify({ message: gettextCatalog.getString('Domain not found', null, 'Error'), classes: 'notification-danger' });
                        } else if (angular.isDefined(result.data) && result.data.Error) {
                            notify({ message: result.data.Error, classes: 'notification-danger' });
                        } else {
                            notify({ message: gettextCatalog.getString('Address creation failed', null, 'Error'), classes: 'notification-danger' });
                        }
                    })
                );
            }.bind(this);

            this.createMember = function () {
                params.cancel();
                $state.go('secured.members', { action: 'new' });
            };

            this.next = function () {
                params.next();
            };

            this.close = function () {
                params.cancel();
            };
        }
    });
})

.factory('domainModal', (pmModal, $rootScope) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/domain.tpl.html',
        controller(params) {
            // Variables
            this.step = params.step;
            this.domain = params.domain;
            this.name = '';

            // Functions
            this.open = function (name) {
                $rootScope.$broadcast(name, params.domain);
            };

            this.submit = function () {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit(this.name);
                }
            };

            this.next = function () {
                if (angular.isDefined(params.next) && angular.isFunction(params.next)) {
                    params.next();
                }
            };

            this.cancel = function () {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

.factory('feedbackModal', (pmModal, $cookies, Bug, notify) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/feedback.tpl.html',
        controller(params) {
            this.fdbckTxt = '';

            this.submit = function () {
                const description = this.fdbckTxt;
                const data = {
                    OS: '--',
                    OSVersion: '--',
                    Browser: '--',
                    BrowserVersion: '--',
                    BrowserExtensions: '--',
                    Client: '--',
                    ClientVersion: '--',
                    Title: '[FEEDBACK v3]',
                    Username: '--',
                    Email: '--',
                    Description: description
                };

                const feedbackPromise = Bug.report(data);

                feedbackPromise.then(
                    (response) => {
                        if (response.data.Code === 1000) {
                            notify({ message: 'Thanks for your feedback!', classes: 'notification-success' });
                        } else if (angular.isDefined(response.data.Error)) {
                            notify({ message: response.data.Error, classes: 'notification-danger' });
                        }
                        params.close();
                    },
                    (error) => {
                        error.message = 'Error during the sending feedback';
                        params.close();
                    }
                );
            };

            this.close = function () {
                params.close();
            };
        }
    });
})

.factory('storageModal', (pmModal, CONSTANTS) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/storage.tpl.html',
        controller(params) {
            // Variables
            const base = CONSTANTS.BASE_SIZE;

            this.organization = params.organization;
            this.member = params.member;
            this.value = params.member.MaxSpace / base / base;
            this.units = [
                {
                    label: 'MB',
                    value: base * base
                },
                {
                    label: 'GB',
                    value: base * base * base
                }
            ];
            this.unit = this.units[0];

            // Functions
            this.submit = function () {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit(this.value * this.unit.value);
                }
            };

            this.cancel = function () {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

.factory('verificationModal', (pmModal, $rootScope) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/verification.tpl.html',
        controller(params) {
            this.domain = params.domain;
            this.step = params.step;
            this.open = function (name) {
                $rootScope.$broadcast(name, params.domain);
            };
            this.submit = function () {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.submit();
                }
            };
            this.next = function () {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.close();
                    params.next();
                }
            };
            this.close = function () {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.close();
                }
            };
        }
    });
})

.factory('spfModal', (pmModal, $rootScope) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/spf.tpl.html',
        controller(params) {
            this.domain = params.domain;
            this.step = params.step;
            this.open = function (name) {
                $rootScope.$broadcast(name, params.domain);
            };
            this.next = function () {
                params.next();
            };
            this.close = function () {
                params.close();
            };
        }
    });
})

.factory('mxModal', (pmModal, $rootScope) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/mx.tpl.html',
        controller(params) {
            this.domain = params.domain;
            this.step = params.step;
            this.open = function (name) {
                $rootScope.$broadcast(name, params.domain);
            };
            this.next = function () {
                params.next();
            };
            this.close = function () {
                params.close();
            };
        }
    });
})

.factory('dkimModal', (pmModal, $rootScope) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/dkim.tpl.html',
        controller(params) {
            this.domain = params.domain;
            this.step = params.step;
            this.open = function (name) {
                $rootScope.$broadcast(name, params.domain);
            };
            this.next = function () {
                params.next();
            };
            this.close = function () {
                params.close();
            };
        }
    });
})

.factory('dmarcModal', (pmModal, $rootScope) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/dmarc.tpl.html',
        controller(params) {
            this.domain = params.domain;
            this.step = params.step;
            this.open = function (name) {
                $rootScope.$broadcast(name, params.domain);
            };
            this.verify = function () {
                params.verify();
            };
            this.close = function () {
                params.close();
            };
        }
    });
})

.factory('bugModal', (pmModal) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/bug.tpl.html',
        controller(params) {
            // Variables
            this.form = params.form;
            this.form.attachScreenshot = false; // Do not attach screenshot by default
            // Functions
            this.submit = function () {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit(this.form);
                }
            };

            this.cancel = function () {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

.factory('supportModal', (pmModal) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/support.tpl.html',
        controller(params) {
            // Variables

            // Functions
            this.cancel = function () {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

.factory('generateModal', (pmModal, networkActivityTracker, Key, pmcw, notify, $q, $rootScope) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/generate.tpl.html',
        controller(params, $scope) {
            // Variables
            const promises = [];
            const QUEUED = 0;
            const GENERATING = 1;
            const DONE = 2;
            const SAVED = 3;
            const ERROR = 4;

            // Parameters
            this.size = 2048;
            this.process = false;
            this.title = params.title;
            this.addresses = params.addresses;
            this.message = params.message;
            // Kill this for now
            this.askPassword = 0; //= params.password.length === 0;
            this.password = params.password;
            _.each(this.addresses, (address) => { address.state = QUEUED; });

            // Listeners
            // FIXME
            // This is broken because authentication depends on generateModal and we can't have circular dependencies
            // It is also bad logic, because which dirty addresses could change and this does not address that
            // Better to just close the modal
            const unsubscribe = $rootScope.$on('updateUser', () => {
                // var dirtyAddresses = [];

                // _.each(authentication.user.Addresses, function(address) {
                //     if (address.Keys.length === 0 && address.Status === 1 && authentication.user.Private === 1) {
                //         dirtyAddresses.push(address);
                //     }
                // });

                // if (dirtyAddresses.length === 0) {
                //     params.close(false);
                // }
                // params.close(false);
            });

            // Functions
            this.submit = function () {
                const numBits = this.size;

                this.process = true;
                _.each(this.addresses, (address) => {
                    address.state = GENERATING;
                    promises.push(pmcw.generateKeysRSA(address.Email, this.password, numBits)
                    .then((result) => {
                        const privateKeyArmored = result.privateKeyArmored;

                        address.state = DONE;

                        return Key.create({
                            AddressID: address.ID,
                            PrivateKey: privateKeyArmored
                        }).then((result) => {
                            if (result.data && result.data.Code === 1000) {
                                address.state = SAVED;
                                address.Keys = address.Keys || [];
                                address.Keys.push(result.data.Key);
                                notify({ message: 'Key created', classes: 'notification-success' });
                                return $q.resolve();
                            } else if (result.data && result.data.Error) {
                                address.state = ERROR;
                                notify({ message: result.data.Error, classes: 'notification-danger' });

                                return $q.reject();
                            }
                            address.state = ERROR;
                            notify({ message: 'Error during create key request', classes: 'notification-danger' });

                            return $q.reject();
                        }, () => {
                            address.state = ERROR;
                            notify({ message: 'Error during the create key request', classes: 'notification-danger' });

                            return $q.reject();
                        });
                    }, (error) => {
                        address.state = ERROR;
                        notify({ message: error, classes: 'notification-danger' });

                        return $q.reject();
                    }));
                });

                $q.all(promises)
                .finally(() => {
                    params.close(true, this.addresses, this.password);
                });
            };

            this.cancel = function () {
                params.close(false);
            };

            $scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    });
})

// Modal to delete account
.factory('deleteAccountModal', (pmModal) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/deleteAccount.tpl.html',
        controller(params) {
            // Variables
            this.feedback = '';
            this.password = '';

            // Functions
            this.submit = function () {
                params.submit(this.password, this.feedback);
            }.bind(this);

            this.cancel = function () {
                params.cancel();
            };
        }
    });
})

.factory('donateModal', (authentication, pmModal, Payment, notify, tools, networkActivityTracker, gettextCatalog, $q) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/donate.tpl.html',
        controller(params) {
            // Variables
            this.process = false;
            this.text = params.message || 'Donate to ProtonMail';
            this.amount = params.amount || 25;
            this.methods = [];
            this.currencies = [
                { label: 'USD', value: 'USD' },
                { label: 'EUR', value: 'EUR' },
                { label: 'CHF', value: 'CHF' }
            ];
            this.currency = _.findWhere(this.currencies, { value: authentication.user.Currency });
            this.number = '';
            this.month = '';
            this.year = '';
            this.cvc = '';
            this.fullname = '';
            this.countries = tools.countries;
            this.country = _.findWhere(this.countries, { value: 'US' });
            this.zip = '';

            if (angular.isDefined(params.currency)) {
                this.currency = _.findWhere(this.currencies, { value: params.currency });
            }

            if (angular.isDefined(params.methods) && params.methods.length > 0) {
                this.methods = params.methods;
                this.method = this.methods[0];
            }

            // Functions
            const validateCardNumber = function () {
                return Payment.validateCardNumber(this.number);
            }.bind(this);

            const validateCardExpiry = function () {
                return Payment.validateCardExpiry(this.month, this.year);
            }.bind(this);

            const validateCardCVC = function () {
                return Payment.validateCardCVC(this.cvc);
            }.bind(this);

            const donatation = function () {
                const year = (this.year.length === 2) ? '20' + this.year : this.year;

                this.process = true;

                return Payment.donate({
                    Amount: this.amount * 100, // Don't be afraid
                    Currency: this.currency.value,
                    Payment: {
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
                    }
                });
            }.bind(this);

            const donatationWithMethod = function () {
                this.process = true;

                return Payment.donate({
                    Amount: this.amount * 100, // Don't be afraid
                    Currency: this.currency.value,
                    PaymentMethodID: this.method.ID
                });
            }.bind(this);

            const finish = function (result) {
                const deferred = $q.defer();

                this.process = false;

                if (result.data && result.data.Code === 1000) {
                    deferred.resolve();
                    notify({ message: 'Your support is essential to keeping ProtonMail running. Thank you for supporting internet privacy!', classes: 'notification-success' });
                    this.close();
                } else if (result.data && result.data.Error) {
                    deferred.reject(new Error(result.data.Error));
                } else {
                    deferred.resolve(new Error(gettextCatalog.getString('Error while processing donation.', null, 'Error')));
                }

                return deferred.promise;
            }.bind(this);

            this.label = function (method) {
                return '•••• •••• •••• ' + method.Details.Last4;
            };

            this.donate = function () {
                let promise;

                if (this.methods.length > 0) {
                    promise = donatationWithMethod()
                    .then(finish)
                    .catch((error) => {
                        notify({ message: error, classes: 'notification-danger' });
                    });
                } else {
                    promise = validateCardNumber()
                    .then(validateCardExpiry)
                    .then(validateCardCVC)
                    .then(donatation)
                    .then(finish)
                    .catch((error) => {
                        notify({ message: error, classes: 'notification-danger' });
                    });
                }

                networkActivityTracker.track(promise);
            };

            this.close = function () {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.close();
                }
            };
        }
    });
})

.factory('monetizeModal', (pmModal, authentication) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/monetize.tpl.html',
        controller(params) {
            this.currencies = [
                { label: 'USD', value: 'USD' },
                { label: 'EUR', value: 'EUR' },
                { label: 'CHF', value: 'CHF' }
            ];
            this.currency = _.findWhere(this.currencies, { value: authentication.user.Currency });
            this.amount = 25; // default value for the amount
            this.amounts = [
                { label: '5', value: 5 },
                { label: '10', value: 10 },
                { label: '25', value: 25 },
                { label: '50', value: 50 },
                { label: '100', value: 100 }
            ];

            this.donate = function () {
                params.donate(this.amount, this.currency.value);
            }.bind(this);

            this.upgrade = function () {
                params.upgrade();
            };

            this.close = function () {
                params.close();
            };
        }
    });
})

.factory('aliasModal', (pmModal, Address, networkActivityTracker, notify) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/alias.tpl.html',
        controller(params) {
            // Variables
            this.local = '';
            this.members = params.members;
            this.member = params.members[0]; // TODO in the future we should add a select to choose a member
            this.domains = [];

            _.each(params.domains, (domain) => {
                this.domains.push({ label: domain, value: domain });
            });

            this.domain = this.domains[0];

            // Functions
            this.add = function () {
                networkActivityTracker.track(
                    Address.create({
                        Local: this.local,
                        Domain: this.domain.value,
                        MemberID: this.member.ID
                    })
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            params.add(result.data.Address);
                        } else if (result.data && result.data.Error) {
                            notify({ message: result.data.Error, classes: 'notification-danger' });
                        }
                    })
                );
            }.bind(this);

            this.cancel = function () {
                params.cancel();
            };
        }
    });
})

// edit address modal
.factory('identityModal', (pmModal, authentication) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/identity.tpl.html',
        controller(params) {
            this.defaultDisplayName = authentication.user.DisplayName;
            this.defaultSignature = authentication.user.Signature;
            this.address = params.address;
            this.address.DisplayName = this.address.DisplayName || authentication.user.DisplayName;
            this.address.Signature = this.address.Signature || authentication.user.Signature;
            this.address.custom = true;

            this.confirm = function () {
                params.confirm(this.address);
            };

            this.cancel = function () {
                params.cancel();
            };
        }
    });
})

.factory('customizeInvoiceModal', (pmModal, Setting, notify, authentication) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/customizeInvoice.tpl.html',
        controller(params) {
            this.text = authentication.user.InvoiceText || '';

            this.submit = function () {
                Setting.invoiceText({ InvoiceText: this.text })
                .then(function (result) {
                    if (result.data && result.data.Code === 1000) {
                        authentication.user.InvoiceText = this.text;
                        notify({ message: 'Invoice customized', classes: 'notification-success' });
                        params.cancel();
                    } else if (result.data && result.data.Error) {
                        notify({ message: result.data.Error, classes: 'notification-danger' });
                    }
                });
            }.bind(this);

            this.cancel = function () {
                params.cancel();
            };
        }
    });
})

.factory('filterModal', ($timeout, $rootScope, pmModal, gettextCatalog, authentication, Filter, networkActivityTracker, notify, CONSTANTS, eventManager, labelModal, Label) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/filter.tpl.html',
        controller(params) {
            const ctrl = this;

            ctrl.hasLabels = false;
            ctrl.hasMove = false;
            ctrl.hasMark = false;

            ctrl.types = [
                { label: gettextCatalog.getString('Select', null), value: 'select' },
                { label: gettextCatalog.getString('Subject', null), value: 'subject' },
                { label: gettextCatalog.getString('Sender', null), value: 'sender' },
                { label: gettextCatalog.getString('Recipient', null), value: 'recipient' },
                { label: gettextCatalog.getString('Attachments', null), value: 'attachments' }
            ];

            ctrl.comparators = [
                { label: gettextCatalog.getString('contains', null), value: 'contains' },
                { label: gettextCatalog.getString('is exactly', null), value: 'is' },
                { label: gettextCatalog.getString('begins with', null), value: 'starts' },
                { label: gettextCatalog.getString('ends with', null), value: 'ends' },
                { label: gettextCatalog.getString('matches', null), value: 'matches' },
                { label: gettextCatalog.getString('does not contain', null), value: '!contains' },
                { label: gettextCatalog.getString('is not', null), value: '!is' },
                { label: gettextCatalog.getString('does not begin with', null), value: '!starts' },
                { label: gettextCatalog.getString('does not end with', null), value: '!ends' },
                { label: gettextCatalog.getString('does not match', null), value: '!matches' }
            ];

            ctrl.operators = [
                { label: gettextCatalog.getString('all', null), value: 'all' },
                { label: gettextCatalog.getString('any', null), value: 'any' }
            ];

            /**
             * Prepare the Conditions Model
             * @param {Object}
             * @return {Array}
             */
            function prepareConditions({ Simple = {} } = {}) {
                const { Conditions = [] } = Simple;
                const conditions = Conditions.map(({ Type = {}, Comparator = {}, Values = [] }) => ({
                    Values,
                    value: '',
                    Type: _.findWhere(ctrl.types, { value: Type.value }),
                    Comparator: _.findWhere(ctrl.comparators, { value: Comparator.value })
                }));

                if (conditions.length === 0) {
                    conditions.push({
                        Values: [],
                        value: '',
                        Type: ctrl.types[0],
                        Comparator: ctrl.comparators[0]
                    });
                }

                return conditions;
            }

            /**
             * Prepare the Actions Model
             * @param {Object}
             * @return {Object} actions
             */
            function prepareActions({ Simple = {} } = {}) {
                const { Actions = {} } = Simple;
                const { Move, Mark = { Read: false, Starred: false }, Labels = [] } = Actions;
                const actions = {};
                const move = Move || '';

                ctrl.hasMove = move.length > 0;
                actions.Move = (move.length) ? move : CONSTANTS.MAILBOX_IDENTIFIERS.inbox;
                ctrl.hasMark = (Mark.Read || Mark.Starred);
                actions.Mark = Mark;
                ctrl.hasLabels = Labels.length > 0;
                actions.Labels = authentication.user.Labels.map((label) => {
                    label.Selected = _.findIndex(Labels, { Name: label.Name }) !== -1;

                    return label;
                });

                return actions;
            }

            /**
             * Prepare the Operator model
             * @param {Object}
             * @return {Object}
             */
            function prepareOperator({ Simple = {} } = {}) {
                const { Operator = {} } = Simple;
                const { value = 'all' } = Operator;

                return _.findWhere(ctrl.operators, { value });
            }

            /**
             * Prepare the ID
             * @param  {String} {ID=''}
             * @return {String}
             */
            function prepareID({ ID = '' } = {}) {
                return ID;
            }

            /**
             * Prepare the Name
             * @param  {String} Name
             * @return {String}
             */
            function prepareName({ Name = '' } = {}) {
                return Name;
            }

            /**
             * Prepare the Status
             * @param  {Integer} Status
             * @return {Integer}
             */
            function prepareStatus({ Status = 1 } = {}) {
                return Status;
            }

            ctrl.initialization = function () {
                ctrl.filter = {
                    ID: prepareID(params.filter),
                    Name: prepareName(params.filter),
                    Status: prepareStatus(params.filter),
                    Version: CONSTANTS.FILTER_VERSION
                };

                if (params.mode === 'simple') {
                    ctrl.mode = 'simple';
                    ctrl.filter.Simple = {
                        Operator: prepareOperator(params.filter),
                        Conditions: prepareConditions(params.filter),
                        Actions: prepareActions(params.filter)
                    };
                } else if (params.mode === 'complex') {
                    ctrl.mode = 'complex';
                    ctrl.filter.Sieve = params.filter.Sieve;
                }

                if (angular.isObject(ctrl.filter.Simple)) {
                    const unsubscribe = [];

                    ['deleteLabel', 'createLabel', 'updateLabel', 'updateLabels'].forEach((name) => {
                        unsubscribe.push($rootScope.$on(name, () => {
                            ctrl.filter.Simple.Actions.Labels = authentication.user.Labels;
                        }));
                    });

                    ctrl.$onDestroy = () => {
                        unsubscribe.forEach((cb) => cb());
                        unsubscribe.length = 0;
                    };
                }

                $timeout(() => {
                    angular.element('#filterName').focus();
                });
            };

            /**
             * Condition Attachements:
             * When you select an option, assign the valid object to the comparator on change
             * @param  {Object} model
             * @param  {String} value Value selected
             * @return {void}
             */
            ctrl.onChangeAttachements = (model, value) => {
                model.Comparator = _.findWhere(ctrl.comparators, { value });
            };

            ctrl.displaySeparator = function () {
                if (ctrl.filter.Simple) {
                    const conditions = ctrl.filter.Simple.Conditions;

                    return conditions.length > 0 && conditions[0].Type.value !== 'select';
                }

                return false;
            };

            ctrl.valid = function () {
                let pass = true;

                // Check name
                pass = ctrl.filter.Name.length > 0;

                if (angular.isObject(ctrl.filter.Simple) && Object.keys(ctrl.filter.Simple).length > 0) {
                    // Simple mode
                    // Check conditions
                    let attachmentsCondition = 0;

                    _.each(ctrl.filter.Simple.Conditions, (condition) => {
                        pass = pass && condition.Type.value !== 'select';

                        if (condition.Type.value === 'subject' || condition.Type.value === 'sender' || condition.Type.value === 'recipient') {
                            pass = pass && condition.Values.length > 0;
                        }

                        if (condition.Type.value === 'attachments') {
                            attachmentsCondition++;
                        }
                    });

                    pass = pass && attachmentsCondition <= 1;

                    // Check actions
                    pass = pass && (ctrl.hasLabels || ctrl.hasMove || ctrl.hasMark);

                    if (ctrl.hasLabels === true) {
                        pass = pass && _.where(ctrl.filter.Simple.Actions.Labels, { Selected: true }).length > 0;
                    }

                    if (ctrl.hasMark === true) {
                        pass = pass && (ctrl.filter.Simple.Actions.Mark.Starred || ctrl.filter.Simple.Actions.Mark.Read);
                    }

                    return pass;
                }
                // Complex mode
                // Check sieve script content
                return ctrl.filter.Sieve.length > 0;
            };

            ctrl.addCondition = function () {
                ctrl.filter.Simple.Conditions.push({
                    Type: _.first(ctrl.types),
                    Comparator: _.first(ctrl.comparators),
                    Values: [],
                    value: ''
                });
            };

            ctrl.addValue = function (condition) {
                if (condition.Values.indexOf(condition.value) === -1) {
                    if (condition.value) {
                        condition.Values.push(condition.value);
                        condition.value = '';
                    }
                } else {
                    notify({ message: gettextCatalog.getString('Text or pattern already included', null), classes: 'notification-danger' });
                }
            };

            ctrl.addLabel = function () {
                labelModal.activate({
                    params: {
                        title: gettextCatalog.getString('Create new label', null, 'Title'),
                        create(name, color) {
                            networkActivityTracker.track(
                                Label.create({
                                    Name: name,
                                    Color: color,
                                    Display: 1
                                }).then((result) => {
                                    if (result.data && result.data.Code === 1000) {
                                        eventManager.call();
                                        labelModal.deactivate();
                                    } else if (result.data && result.data.Error) {
                                        notify({ message: result.data.Error, classes: 'notification-danger' });
                                    }
                                })
                            );
                        },
                        cancel() {
                            labelModal.deactivate();
                        }
                    }
                });
            };

            ctrl.removeCondition = function (condition) {
                const index = ctrl.filter.Simple.Conditions.indexOf(condition);

                ctrl.filter.Simple.Conditions.splice(index, 1);
            };

            ctrl.save = function () {
                let promise;
                let messageSuccess;
                const clone = angular.copy(ctrl.filter);

                if (angular.isObject(ctrl.filter.Simple) && Object.keys(ctrl.filter.Simple).length > 0) {
                    if (ctrl.hasLabels === true) {
                        clone.Simple.Actions.Labels = _.filter(clone.Simple.Actions.Labels, (label) => { return label.Selected === true; });
                    } else {
                        clone.Simple.Actions.Labels = [];
                    }

                    if (ctrl.hasMove === false) {
                        clone.Simple.Actions.Move = null;
                    }

                    if (ctrl.hasMark === false) {
                        clone.Simple.Actions.Mark = { Read: false, Starred: false };
                    }
                }

                if (clone.ID) {
                    promise = Filter.update(clone);
                    messageSuccess = gettextCatalog.getString('Filter updated', null, 'Notification');
                } else {
                    promise = Filter.create(clone);
                    messageSuccess = gettextCatalog.getString('Filter created', null, 'Notification');
                }

                networkActivityTracker.track(
                    promise.then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            notify({ message: messageSuccess, classes: 'notification-success' });
                            eventManager.call();
                            params.close();
                        } else if (result.data && result.data.Error) {
                            notify({ message: result.data.Error, classes: 'notification-danger' });

                            if (result.data.Code === 50016) {
                                eventManager.call();
                                params.close();
                            }
                        }
                    })
                );
            };

            ctrl.cancel = function () {
                params.close();
            };

            ctrl.initialization();
        }
    });
})

.factory('hotkeyModal', (pmModal, authentication, CONSTANTS) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/hotkey.tpl.html',
        controller(params) {
            this.isMac = navigator.userAgent.indexOf('Mac OS X') !== -1;

            if (authentication.user.ViewLayout === CONSTANTS.ROW_MODE) {
                this.mode = 'row';
            } else if (authentication.user.ViewLayout === CONSTANTS.COLUMN_MODE) {
                this.mode = 'column';
            }

            this.close = function () {
                params.close();
            };
        }
    });
})

.factory('filterAddressModal', ($timeout, pmModal, IncomingDefault, networkActivityTracker, notify) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/filterAddress.tpl.html',
        controller(params) {
            this.filter = {
                Email: '',
                Location: params.location
            };

            this.create = function () {
                networkActivityTracker.track(
                    IncomingDefault.add(this.filter)
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            params.add(result.data.IncomingDefault);
                        } else if (result.data && result.data.Error) {
                            notify({ message: result.data.Error, classes: 'notification-danger' });
                        }
                    })
                );
            }.bind(this);

            this.cancel = function () {
                params.close();
            };

            $timeout(() => {
                angular.element('#emailAddress').focus();
            });
        }
    });
})

.factory('sharedSecretModal', (pmModal, $timeout) => {

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/twofactor/sharedSecret.tpl.html',
        controller(params) {
            this.sharedSecret = params.sharedSecret;
            this.next = function () {
                if (angular.isDefined(params.next) && angular.isFunction(params.next)) {
                    params.next();
                }
            };

            this.cancel = function () {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            this.makeCode = function () {
                $timeout(() => {
                    /* eslint no-new: "off" */
                    new QRCode(document.getElementById('qrcode'), params.qrURI);
                }, 0);
            };
        }
    });
})

.factory('recoveryCodeModal', (pmModal) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/twofactor/recoveryCode.tpl.html',
        controller(params) {
            this.title = params.title;
            this.message = params.message;
            this.recoveryCodesFirstHalf = params.recoveryCodes.slice(0, 8);
            this.recoveryCodesSecondHalf = params.recoveryCodes.slice(8, 16);
            this.done = function () {
                if (angular.isDefined(params.done) && angular.isFunction(params.done)) {
                    params.done();
                }
            };
            this.download = function () {
                if (angular.isDefined(params.download) && angular.isFunction(params.download)) {
                    params.download();
                }
            };
            this.cancel = function () {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

        }
    });
})

.factory('welcomeModal', (pmModal, Setting, authentication, networkActivityTracker, $q) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/welcome.tpl.html',
        controller(params) {
            this.displayName = authentication.user.DisplayName;

            this.cancel = function () {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            this.next = function () {
                const promises = [];

                if (this.displayName.length > 0) {
                    promises.push(Setting.display({ DisplayName: this.displayName }));
                    authentication.user.DisplayName = this.displayName;
                }

                networkActivityTracker.track(
                    $q.all(promises)
                    .then(() => {
                        if (angular.isDefined(params.next) && angular.isFunction(params.next)) {
                            params.next(this.displayName);
                        }
                    })
                );
            }.bind(this);
        }
    });
});
