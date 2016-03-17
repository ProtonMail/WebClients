angular.module("proton.modals", [])

.factory('pmModal', function(
    $animate,
    $compile,
    $rootScope,
    $controller,
    $q,
    $http,
    $templateCache
) {
    return function modalFactory(config) {
        if (!(!config.template ^ !config.templateUrl)) {
            throw new Error('Expected modal to have exacly one of either template or templateUrl');
        }

        var template = config.template,
            controller = config.controller || null,
            controllerAs = config.controllerAs,
            container = angular.element(config.container || document.body),
            element = null,
            html,
            scope;

        if (config.template) {
            html = $q.when(config.template);
        } else {
            html = $http.get(config.templateUrl, {
                cache: $templateCache
            }).
            then(function(response) {
                return response.data;
            });
        }

        function activate(locals) {
            return html.then(function(html) {
                if (!element) {
                    attach(html, locals);
                }
                $(body).append('<div class="modal-backdrop fade in"></div>');
                $rootScope.modalOpen = true;
                setTimeout(function() {
                    $('.modal').addClass('in');
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
                    locals = {};
                }
                locals.$scope = scope;
                var ctrl = $controller(controller, locals);
                if (controllerAs) {
                    scope[controllerAs] = ctrl;
                }
            } else if (locals) {
                for (var prop in locals) {
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
            return $animate.leave(element).then(function() {
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
            activate: activate,
            deactivate: deactivate,
            active: active
        };
    };
})

// confirm modal
.factory('confirmModal', function(pmModal) {
    return pmModal({
        controller: function(params) {
            this.message = params.message;
            this.title = params.title;

            this.confirm = function() {
                if (angular.isDefined(params.confirm) && angular.isFunction(params.confirm)) {
                    params.confirm();
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/confirm.tpl.html'
    });
})

// alert modal
.factory('alertModal', function(pmModal) {
    return pmModal({
        controller: function(params) {
            this.title = params.title;
            this.message = params.message;
            this.alert = params.alert || 'alert-info';

            this.ok = function() {
                params.ok();
            };
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/alert.tpl.html'
    });
})

// login help modal
.factory('loginModal', function(pmModal) {
    return pmModal({
        controller: function(params) {
            this.cancel = function() {
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
.factory('contactModal', function(pmModal) {
    return pmModal({
        controller: function(params, $timeout) {
            this.name = params.name;
            this.email = params.email;
            this.title = params.title;

            this.save = function() {
                if (angular.isDefined(params.save) && angular.isFunction(params.save)) {
                    params.save(this.name, this.email);
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            $timeout(function() {
                $('#contactName').focus();
            }.bind(this), 100);
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/contact.tpl.html'
    });
})

// label modal
.factory('labelModal', function(pmModal) {
    return pmModal({
        controller: function(params, $timeout) {
            this.title = params.title;
            this.colors = [
                '#7272a7',
                '#8989ac',

                '#cf5858',
                '#cf7e7e',

                '#c26cc7',
                '#c793ca',

                '#7569d1',
                '#9b94d1',

                '#69a9d1',
                '#a8c4d5',

                '#5ec7b7',
                '#97c9c1',

                '#72bb75',
                '#9db99f',

                '#c3d261',
                '#c6cd97',

                '#e6c04c',
                '#e7d292',

                '#e6984c',
                '#dfb286'
            ];

            if(angular.isDefined(params.label)) {
                this.name = params.label.Name;
                this.color = params.label.Color;
            } else {
                this.name = '';
                this.color = this.colors[0];
            }

            this.create = function() {
                if (angular.isDefined(params.create) && angular.isFunction(params.create)) {
                    params.create(this.name, this.color);
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            $timeout(function() {
                $('#labelName').focus();
            }.bind(this), 100);
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/label.tpl.html'
    });
})

// dropzone modal
.factory('dropzoneModal', function(pmModal) {
    return pmModal({
        controller: function(params, notify, $timeout) {
            var files = [];
            var fileCount = 0;
            var idDropzone = 'dropzone';
            var idSelectedFile = 'selectedFile';
            var extension;
            var self = this;

            this.title = params.title;
            this.message = params.message;

            function init() {
                var drop = document.getElementById(idDropzone);

                drop.ondrop = function(e) {
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

                drop.ondragover = function(event) {
                    event.preventDefault();
                    self.hover = true;
                };

                drop.ondragleave = function(event) {
                    event.preventDefault();
                    self.hover = false;
                };

                $('#' + idDropzone).on('click', function() {
                    $('#' + idSelectedFile).trigger('click');
                });

                $('#' + idSelectedFile).change(function(e) {
                    extension = $('#' + idSelectedFile)[0].files[0].name.substr($('#' + idSelectedFile)[0].files[0].name.length - 4);

                    if (extension !== '.csv' && extension !== '.vcf') {
                        notify('Invalid file type');
                    } else {
                        files = $('#' + idSelectedFile)[0].files;
                        self.fileDropped = $('#' + idSelectedFile)[0].files[0].name;
                        self.hover = false;
                    }
                });
            }

            this.import = function() {
                if (angular.isDefined(params.import) && angular.isFunction(params.import)) {
                    params.import(files);
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            $timeout(function() {
                init();
            }.bind(this), 100);
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/dropzone.tpl.html'
    });
})

// Card modal
.factory('cardModal', function(pmModal, Payment, notify, pmcw, tools, $translate, $q) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/card.tpl.html',
        controller: function(params) {
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
                this.country = _.findWhere(this.countries, {value: params.method.Details.Country});
            } else {
                this.text = 'Add a credit card.';
                this.number = '';
                this.fullname = '';
                this.month = '';
                this.year = '';
                this.cvc = '';
                this.zip = '';
                this.country = _.findWhere(this.countries, {value: 'US'});
            }

            // Functions
            var validateCardNumber = function() {
                if (this.cardChange === true) {
                    return Payment.validateCardNumber(this.number);
                } else {
                    return Promise.resolve();
                }
            }.bind(this);

            var validateCardExpiry = function() {
                if (this.cardChange === true) {
                    return Payment.validateCardExpiry(this.month, this.year);
                } else {
                    return Promise.resolve();
                }
            }.bind(this);

            var validateCardCVC = function() {
                if (this.cardChange === true) {
                    return Payment.validateCardCVC(this.cvc);
                } else {
                    return Promise.resolve();
                }
            }.bind(this);

            var method = function() {
                var deferred = $q.defer();

                if (this.cardChange === true) {
                    var year = (this.year.length === 2) ? '20' + this.year : this.year;

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
                    }).then(function(result) {
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

            var finish = function(method) {
                params.close(method);
            };

            this.submit = function() {
                this.process = true;

                validateCardNumber()
                .then(validateCardExpiry)
                .then(validateCardCVC)
                .then(method)
                .then(finish)
                .catch(function(error) {
                    notify({message: error, classes: 'notification-danger'});
                    this.process = false;
                }.bind(this));
            };

            this.cancel = function() {
                params.close();
            };
        }
    });
})

.factory('loginPasswordModal', function(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/loginPassword.tpl.html',
        controller: function(params) {
            this.loginPassword = '';

            this.submit = function() {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit(this.loginPassword);
                }
            }.bind(this);

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

.factory('reactivateModal', function(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/reactivate.tpl.html',
        controller: function(params) {
            this.loginPassword = '';
            this.keyPassword = '';

            /**
             * Submit password
             */
            this.submit = function() {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit(this.loginPassword, this.keyPassword);
                }
            }.bind(this);

            /**
             * Close modal
             */
            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

.factory('payModal', function(pmModal, Payment, notify) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/pay.tpl.html',
        controller: function(params) {
            // Variables
            this.choice = 'card';
            this.amount = params.amount;
            this.amountDue = params.amountDue;
            this.credit = params.credit;
            this.currency = params.currency;
            this.methods = params.methods;
            this.method = this.methods[0];
            this.invoice = params.invoice;

            // Functions
            this.label = function(method) {
                return '•••• •••• •••• ' + method.Details.Last4;
            };

            this.submit = function() {
                Payment.pay(params.invoice.ID, {
                    Amount: params.amountDue,
                    Currency: params.currency,
                    PaymentMethodID: this.method.ID
                }).then(function(result) {
                    if (result.data && result.data.Code === 1000) {
                        params.close(true);
                    } else if (result.data && result.data.Error) {
                        notify({message: result.data.Error, classes: 'notification-danger'});
                    }
                });
            }.bind(this);

            this.cancel = function() {
                params.close();
            };

            this.initPaypal = function() {
                Payment.paypal({
                    Amount: params.amountDue,
                    Currency: params.currency
                }).then(function(result) {
                    if (result.data && result.data.Code === 1000) {
                        this.approvalURL = result.data.ApprovalURL;
                    } else if (result.data && result.data.Error){
                        notify({message: result.data.Error, classes: 'notification-danger'});
                    }
                }.bind(this));
            }.bind(this);

            this.openPaypalTab = function() {
                this.childWindow = window.open(this.approvalURL, 'PayPal');
                window.addEventListener('message', this.receivePaypalMessage, false);
            };

            this.receivePaypalMessage = function(event) {
                var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.

                if (origin !== 'https://secure.protonmail.com') {
                    return;
                }

                var paypalObject = event.data;

                // we need to capitalize some stuff
                if (paypalObject.payerID && paypalObject.paymentID) {
                    paypalObject.PayerID = paypalObject.payerID;
                    paypalObject.PaymentID = paypalObject.paymentID;

                    // delete unused
                    delete paypalObject.payerID;
                    delete paypalObject.paymentID;
                }

                Payment.pay(params.invoice.ID, {
                    Amount: params.amountDue,
                    Currency: params.currency,
                    Payment : {
                        Type: 'paypal',
                        Details: paypalObject
                    }
                }).then(function(result) {
                    if (result.data && result.data.Code === 1000) {
                        params.close(true);
                    } else if (result.data && result.data.Error) {
                        notify({message: result.data.Error, classes: 'notification-danger'});
                    }
                });

                this.childWindow.close();
                window.removeEventListener('message', this.receivePaypalMessage, false);
            }.bind(this);
        }
    });
})

// Payment modal
.factory('paymentModal', function(
    notify,
    pmModal,
    Organization,
    $translate,
    $log,
    $window,
    $q,
    Payment,
    authentication,
    pmcw,
    tools,
    CONSTANTS
) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/payment/modal.tpl.html',
        controller: function(params) {

            // IE11 doesn't support PayPal
            if ($.browser.msie === true && $.browser.edge !== true) {
                this.choices = [
                    {value: 'card', label: $translate.instant('CREDIT_CARD')},
                    {value: 'bitcoin', label: 'Bitcoin'}
                ];
            } else {
                this.choices = [
                    {value: 'card', label: $translate.instant('CREDIT_CARD')},
                    {value: 'paypal', label: 'PayPal'},
                    {value: 'bitcoin', label: 'Bitcoin'}
                ];
            }

            // Variables
            this.paypalNetworkError = false;
            this.paypalAccessError = false;
            this.choice = this.choices[0];
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
            this.country = _.findWhere(this.countries, {value: 'US'});
            this.plans = _.chain(params.plans)
                .filter(function(plan) { return params.planIDs.indexOf(plan.ID) !== -1; })
                .uniq()
                .value();
            this.organizationName = $translate.instant('MY_ORGANIZATION'); // TODO set this value for the business plan

            // Functions

            var initialization = function() {
                if (params.methods.length > 0) {
                    this.methods = params.methods;
                    this.method = this.methods[0];
                }

                if (angular.isDefined(params.choice)) {
                    this.choice = _.findWhere(this.choices, {value: params.choice});
                    this.changeChoice();
                }
            };

            /**
             * Generate key for the organization
             */
            var organizationKey = function() {
                var deferred = $q.defer();

                if (params.create === true) {
                    var mailboxPassword = authentication.getPassword();

                    pmcw.generateKeysRSA('pm_org_admin', mailboxPassword)
                    .then(function(response) {
                        var privateKey = response.privateKeyArmored;

                        deferred.resolve({
                            DisplayName: this.organizationName,
                            PrivateKey: privateKey,
                            BackupPrivateKey: privateKey
                        });
                    }.bind(this), function(error) {
                        deferred.reject(new Error('Error during the generation of new keys for pm_org_admin'));
                    });
                } else {
                    deferred.resolve();
                }

                return deferred.promise;
            }.bind(this);
            /**
             * Create an organization
             */
            var createOrganization = function(parameters) {
                var deferred = $q.defer();

                if (params.create === true) {
                    Organization.create(parameters)
                    .then(function(result) {
                        if(angular.isDefined(result.data) && result.data.Code === 1000) {
                            deferred.resolve(result);
                        } else if(angular.isDefined(result.data) && angular.isDefined(result.data.Error)) {
                            deferred.reject(new Error(result.data.Error));
                        } else {
                            deferred.reject(new Error($translate.instant('ERROR_DURING_ORGANIZATION_REQUEST')));
                        }
                    }.bind(this), function(error) {
                        deferred.reject(new Error($translate.instant('ERROR_DURING_ORGANIZATION_REQUEST')));
                    });
                } else {
                    deferred.resolve();
                }

                return deferred.promise;
            }.bind(this);

            var validateCardNumber = function() {
                if (this.methods.length === 0 && this.valid.AmountDue > 0) {
                    return Payment.validateCardNumber(this.number);
                } else {
                    return Promise.resolve();
                }
            }.bind(this);

            var validateCardExpiry = function() {
                if (this.methods.length === 0 && this.valid.AmountDue > 0) {
                    return Payment.validateCardExpiry(this.month, this.year);
                } else {
                    return Promise.resolve();
                }
            }.bind(this);

            var validateCardCVC = function() {
                if (this.methods.length === 0 && this.valid.AmountDue > 0) {
                    return Payment.validateCardCVC(this.cvc);
                } else {
                    return Promise.resolve();
                }
            }.bind(this);

            var method = function() {
                var deferred = $q.defer();

                if (this.methods.length === 0 && this.valid.AmountDue > 0) {
                    var year = (this.year.length === 2) ? '20' + this.year : this.year;

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
                    }).then(function(result) {
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

            var subscribe = function(methodID) {
                var deferred = $q.defer();

                Payment.subscribe({
                    Amount : this.valid.AmountDue,
                    Currency : params.valid.Currency,
                    PaymentMethodID : methodID,
                    CouponCode : this.coupon,
                    PlanIDs: params.planIDs
                }).then(function(result) {
                    if (result.data && result.data.Code === 1000) {
                        deferred.resolve();
                    } else if (result.data && result.data.Error) {
                        deferred.reject(new Error(result.data.Error));
                    }
                });

                return deferred.promise;
            }.bind(this);

            var chargePaypal = function(paypalObject) {
                var deferred = $q.defer();

                Payment.subscribe({
                    Amount : this.valid.AmountDue,
                    Currency : params.valid.Currency,
                    CouponCode : this.coupon,
                    PlanIDs: params.planIDs,
                    Payment : {
                        Type: 'paypal',
                        Details: paypalObject
                    }
                }).then(function(result) {
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

            var finish = function(subscription) {
                this.step = 'thanks';
                params.change();
            }.bind(this);

            this.label = function(method) {
                return '•••• •••• •••• ' + method.Details.Last4;
            };

            this.submit = function() {
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
                .catch(function(error) {
                    notify({message: error, classes: 'notification-danger'});
                    this.step = 'payment';
                }.bind(this));
            }.bind(this);

            this.count = function(type) {
                var count = 0;
                var plans = [];

                _.each(params.planIDs, function(planID) {
                    plans.push(_.findWhere(params.plans, {ID: planID}));
                });

                _.each(plans, function(plan) {
                    count += plan[type];
                });

                return count;
            };

            this.switch = function(cycle, currency) {
                params.switch(cycle, currency);
            };

            this.apply = function() {
                Payment.valid({
                    Currency : this.valid.Currency,
                    Cycle : this.valid.Cycle,
                    CouponCode : this.coupon,
                    PlanIDs: params.planIDs
                })
                .then(function(result) {
                    if (result.data && result.data.Code === 1000) {
                        if (result.data.CouponDiscount === 0) {
                            notify({message: $translate.instant('COUPON_INVALID'), classes: 'notification-danger'});
                            this.coupon = '';
                        } else {
                            notify({message: $translate.instant('COUPON_ACCEPTED'), classes: 'notification-success'});
                        }
                        this.valid = result.data;
                    }
                }.bind(this));
            }.bind(this);

            this.changeChoice = function() {
                if (this.choice.value === 'paypal') {
                    if (this.valid.Currency === 'USD' && this.valid.Cycle === 12) {
                        this.initPaypal();
                    } else if (this.valid.Currency === 'USD' && this.valid.Cycle === 1) {
                        this.paypalAccessError = 1; // We only accept PayPal for annual subscriptions, click here to switch to an annual subscription. [Change Subscription]
                    } else if (this.valid.Currency !== 'USD' && this.valid.Cycle === 1) {
                        this.paypalAccessError = 2; // We only accept PayPal for annual subscriptions. PayPal is also only accepted for USD plans. Click here to switch to an annual USD subscription. [Change Subscription]
                    } else if (this.valid.Currency !== 'USD' && this.valid.Cycle === 12) {
                        this.paypalAccessError = 3; // All PayPal orders are charged in USD, click here to change your subscription to USD. [Change Subscription]
                    }
                }
            };

            this.initPaypal = function() {
                this.paypalNetworkError = false;

                Payment.paypal({
                    Amount : this.valid.AmountDue,
                    Currency : this.valid.Currency // Only USD allowed for now
                }).then(function(result) {
                    if (result.data && result.data.Code === 1000) {
                        if (result.data.ApprovalURL) {
                            this.approvalURL = result.data.ApprovalURL;
                        }
                    } else if (result.data.Code === 22802) {
                        this.paypalNetworkError = true;
                    } else if (result.data && result.data.Error){
                        notify({message: result.data.Error, classes: 'notification-danger'});
                    }
                }.bind(this));
            }.bind(this);

            /**
             * Open Paypal website in a new tab
             */
            this.openPaypalTab = function() {
                this.childWindow = window.open(this.approvalURL, 'PayPal');
                window.addEventListener('message', this.receivePaypalMessage, false);
            };

            this.receivePaypalMessage = function(event) {
                var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.

                if (origin !== 'https://secure.protonmail.com') {
                    return;
                }

                var paypalObject = event.data;

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
                .catch(function(error) {
                    notify({message: error, classes: 'notification-danger'});
                    this.step = 'payment';
                }.bind(this));

                this.childWindow.close();
                window.removeEventListener('message', this.receivePaypalMessage, false);
            }.bind(this);

            /**
             * Close payment modal
             */
            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            initialization();
        }
    });
})

.factory('userModal', function(pmModal, CONSTANTS) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/user/modal.tpl.html',
        controller: function(params) {
            // Variables
            var base = CONSTANTS.BASE_SIZE;

            // Parameters
            this.step = 'member';
            this.organization = params.organization;
            this.domains = params.domains;
            this.domain = params.domains[0];
            this.nickname = '';
            this.loginPassword = '';
            this.confirmPassword = '';
            this.address = '';
            this.quota = 0;
            this.units = [
                {label: 'MB', value: base * base},
                {label: 'GB', value: base * base * base}
            ];
            this.unit = this.units[0];
            this.private = false; // Uncheck by default

            // Functions
            this.submit = function() {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit();
                }
            };

            this.next = function() {
                this.step = 'address';
            }.bind(this);

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            this.add = function() {

            };
        }
    });
})

.factory('buyDomainModal', function(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/buy.tpl.html',
        controller: function(params) {
            // Functions
            this.submit = function() {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit();
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

.factory('addressModal', function(pmModal, $rootScope, networkActivityTracker, notify, Address, $translate, eventManager) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/address.tpl.html',
        controller: function(params) {
            // Variables
            this.domain = params.domain;
            this.step = params.step;
            this.members = params.members;
            this.member = params.members[0];
            this.address = '';

            this.open = function(name) {
                $rootScope.$broadcast(name, params.domain);
            };

            // Functions
            this.add = function() {
                networkActivityTracker.track(
                    Address.create({
                        Local: this.address, // local part
                        Domain: this.domain.DomainName,
                        MemberID: this.member.ID // either you custom domain or a protonmail domain
                    })
                ).then(function(result) {
                    if(angular.isDefined(result.data) && result.data.Code === 1000) {
                        notify({message: $translate.instant('ADDRESS_ADDED'), classes: 'notification-success'});
                        this.domain.Addresses.push(result.data.Address);
                        eventManager.call();
                    } else if(angular.isDefined(result.data) && result.data.Code === 31006) {
                        notify({message: $translate.instant('DOMAIN_NOT_FOUND'), classes: 'notification-danger'});
                    } else if(angular.isDefined(result.data) && result.data.Error) {
                        notify({message: result.data.Error, classes: 'notification-danger'});
                    } else {
                        notify({message: $translate.instant('ADDRESS_CREATION_FAILED'), classes: 'notification-danger'});
                    }
                }.bind(this), function(error) {
                    notify({message: $translate.instant('ADDRESS_CREATION_FAILED'), classes: 'notification-danger'});
                });
            }.bind(this);

            this.next = function() {
                params.next();
            };

            this.close = function() {
                params.cancel();
            };
        }
    });
})

.factory('domainModal', function(pmModal, $rootScope) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/domain.tpl.html',
        controller: function(params) {
            // Variables
            this.step = params.step;
            this.domain = params.domain;
            this.name = '';

            // Functions
            this.open = function(name) {
                $rootScope.$broadcast(name, params.domain);
            };

            this.submit = function() {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit(this.name);
                }
            };

            this.next = function() {
                if (angular.isDefined(params.next) && angular.isFunction(params.next)) {
                    params.next();
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

.factory('feedbackModal', function(pmModal, $cookies, Bug, notify) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/feedback.tpl.html',
        controller: function(params) {
            this.fdbckTxt = '';

            this.submit = function() {
                var description = this.fdbckTxt;
                var data = {
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

                var feedbackPromise = Bug.report(data);

                feedbackPromise.then(
                    function(response) {
                        if(response.data.Code === 1000) {
                            notify({message: 'Thanks for your feedback!', classes: 'notification-success'});
                        } else if (angular.isDefined(response.data.Error)) {
                            notify({message: response.data.Error, classes: 'notification-danger'});
                        }
                        params.close();
                    },
                    function(err) {
                        error.message = 'Error during the sending feedback';
                        params.close();
                    }
                );
            };

            this.close = function() {
                params.close();
            };
        }
    });
})

.factory('storageModal', function(pmModal, CONSTANTS) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/storage.tpl.html',
        controller: function(params) {
            // Variables
            var base = CONSTANTS.BASE_SIZE;

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
            this.submit = function() {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit(this.value * this.unit.value);
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

.factory('verificationModal', function(pmModal, $rootScope) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/verification.tpl.html',
        controller: function(params) {
            this.domain = params.domain;
            this.step = params.step;
            this.open = function(name) {
                $rootScope.$broadcast(name, params.domain);
            };
            this.submit = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.submit();
                }
            };
            this.next = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.close();
                    params.next();
                }
            };
            this.close = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.close();
                }
            };
        }
    });
})

.factory('spfModal', function(pmModal, $rootScope) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/spf.tpl.html',
        controller: function(params) {
            this.domain = params.domain;
            this.step = params.step;
            this.open = function(name) {
                $rootScope.$broadcast(name, params.domain);
            };
            this.next = function() {
                params.next();
            };
            this.close = function() {
                params.close();
            };
        }
    });
})

.factory('mxModal', function(pmModal, $rootScope) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/mx.tpl.html',
        controller: function(params) {
            this.domain = params.domain;
            this.step = params.step;
            this.open = function(name) {
                $rootScope.$broadcast(name, params.domain);
            };
            this.next = function() {
                params.next();
            };
            this.close = function() {
                params.close();
            };
        }
    });
})

.factory('dkimModal', function(pmModal, $rootScope) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/dkim.tpl.html',
        controller: function(params) {
            this.domain = params.domain;
            this.step = params.step;
            this.open = function(name) {
                $rootScope.$broadcast(name, params.domain);
            };
            this.next = function() {
                params.next();
            };
            this.close = function() {
                params.close();
            };
        }
    });
})

.factory('dmarcModal', function(pmModal, $rootScope) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/dmarc.tpl.html',
        controller: function(params) {
            this.domain = params.domain;
            this.step = params.step;
            this.open = function(name) {
                $rootScope.$broadcast(name, params.domain);
            };
            this.verify = function() {
                params.verify();
            };
            this.close = function() {
                params.close();
            };
        }
    });
})

.factory('bugModal', function(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/bug.tpl.html',
        controller: function(params) {
            // Variables
            this.form = params.form;
            this.form.attachScreenshot = false; // Do not attach screenshot by default
            // Functions
            this.submit = function() {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit(this.form);
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

.factory('supportModal', function(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/support.tpl.html',
        controller: function(params) {
            // Variables

            // Functions
            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

.factory('generateModal', function(pmModal, networkActivityTracker, Key, pmcw, authentication, notify, $q, $rootScope) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/generate.tpl.html',
        controller: function(params) {
            // Variables
            var mailboxPassword = authentication.getPassword();
            var promises = [];
            var QUEUED = 0;
            var GENERATING = 1;
            var DONE = 2;
            var SAVED = 3;
            var ERROR = 4;

            // Parameters
            this.size = 2048;
            this.process = false;
            this.title = params.title;
            this.addresses = params.addresses;
            this.message = params.message;
            _.each(this.addresses, function(address) { address.state = QUEUED; });

            // Listeners
            $rootScope.$on('updateUser', function(event) {
                var dirtyAddresses = [];

                _.each(authentication.user.Addresses, function(address) {
                    if (address.Keys.length === 0 && address.Status === 1 && authentication.user.Private === 1) {
                        dirtyAddresses.push(address);
                    }
                });

                if (dirtyAddresses.length === 0) {
                    params.cancel();
                }
            });

            // Functions
            this.submit = function() {
                var numBits = this.size;

                this.process = true;
                _.each(this.addresses, function(address) {
                    address.state = GENERATING;
                    promises.push(pmcw.generateKeysRSA(
                        address.Email,
                        mailboxPassword,
                        numBits
                    ).then(function(result) {
                        address.state = DONE;
                        // var publicKeyArmored = result.publicKeyArmored; not used
                        var privateKeyArmored = result.privateKeyArmored;

                        return Key.create({
                            AddressID: address.ID,
                            PrivateKey: privateKeyArmored
                        }).then(function(result) {
                            if (result.data && result.data.Code === 1000) {
                                address.state = SAVED;

                                return $q.resolve();
                            } else if (result.data && result.data.Error) {
                                address.state = ERROR;
                                notify({message: result.data.Error, classes: 'notification-danger'});

                                return $q.reject();
                            } else {
                                address.state = ERROR;
                                notify({message: 'Error during create key request', classes: 'notification-danger'});

                                return $q.reject();
                            }
                        }.bind(this), function(error) {
                            address.state = ERROR;
                            notify({message: 'Error during the create key request', classes: 'notification-danger'});

                            return $q.reject();
                        });
                    }.bind(this), function(error) {
                        address.state = ERROR;
                        notify({message: error, classes: 'notification-danger'});

                        return $q.reject();
                    }));
                }.bind(this));

                $q.all(promises)
                .finally(function() {
                    params.cancel();
                }.bind(this));
            };

            this.cancel = function() {
                params.cancel();
            };
        }
    });
})

// Modal to delete account
.factory('deleteAccountModal', function(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/deleteAccount.tpl.html',
        controller: function(params) {
            // Variables

            // Functions
            this.submit = function() {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit();
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

.factory('donateModal', function(authentication, pmModal, Payment, notify, tools, networkActivityTracker, $translate, $q) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/donate.tpl.html',
        controller: function(params) {
            // Variables
            this.process = false;
            this.text = params.message || 'Donate to ProtonMail';
            this.amount = params.amount || 25;
            this.methods = [];
            this.currencies = [
                {label: 'USD', value: 'USD'},
                {label: 'EUR', value: 'EUR'},
                {label: 'CHF', value: 'CHF'}
            ];
            this.currency = _.findWhere(this.currencies, {value: authentication.user.Currency});
            this.number = '';
            this.month = '';
            this.year = '';
            this.cvc = '';
            this.fullname = '';
            this.countries = tools.countries;
            this.country = _.findWhere(this.countries, {value: 'US'});
            this.zip = '';

            if (angular.isDefined(params.currency)) {
                this.currency = _.findWhere(this.currencies, {value: params.currency});
            }

            if (angular.isDefined(params.methods) && params.methods.length > 0) {
                this.methods = params.methods;
                this.method = this.methods[0];
            }

            // Functions
            var validateCardNumber = function() {
                return Payment.validateCardNumber(this.number);
            }.bind(this);

            var validateCardExpiry = function() {
                return Payment.validateCardExpiry(this.month, this.year);
            }.bind(this);

            var validateCardCVC = function() {
                return Payment.validateCardCVC(this.cvc);
            }.bind(this);

            var donatation = function() {
                var year = (this.year.length === 2) ? '20' + this.year : this.year;

                this.process = true;

                return Payment.donate({
                    Amount: this.amount * 100, // Don't be afraid
                    Currency: this.currency.value,
                    Payment : {
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

            var donatationWithMethod = function() {
                this.process = true;

                return Payment.donate({
                    Amount: this.amount * 100, // Don't be afraid
                    Currency: this.currency.value,
                    PaymentMethodID: this.method.ID
                });
            }.bind(this);

            var finish = function(result) {
                var deferred = $q.defer();

                this.process = false;

                if (result.data && result.data.Code === 1000) {
                    deferred.resolve();
                    notify({message: 'Your support is essential to keeping ProtonMail running. Thank you for supporting internet privacy!', classes: 'notification-success'});
                    this.close();
                } else if (result.data && result.data.Error) {
                    deferred.reject(new Error(result.data.Error));
                } else {
                    deferred.resolve(new Error($translate.instant('ERROR_DURING_DONATION_REQUEST')));
                }

                return deferred.promise;
            }.bind(this);

            this.label = function(method) {
                return '•••• •••• •••• ' + method.Details.Last4;
            };

            this.donate = function() {
                var promise;

                if (this.methods.length > 0) {
                    promise = donatationWithMethod()
                    .then(finish)
                    .catch(function(error) {
                        notify({message: error, classes: 'notification-danger'});
                    });
                } else {
                    promise = validateCardNumber()
                    .then(validateCardExpiry)
                    .then(validateCardCVC)
                    .then(donatation)
                    .then(finish)
                    .catch(function(error) {
                        notify({message: error, classes: 'notification-danger'});
                    });
                }

                networkActivityTracker.track(promise);
            };

            this.close = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.close();
                }
            };
        }
    });
})

.factory('monetizeModal', function(pmModal, authentication) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/monetize.tpl.html',
        controller: function(params) {
            this.currencies = [
                {label: 'USD', value: 'USD'},
                {label: 'EUR', value: 'EUR'},
                {label: 'CHF', value: 'CHF'}
            ];
            this.currency = _.findWhere(this.currencies, {value: authentication.user.Currency});
            this.amount = 25; // default value for the amount
            this.amounts = [
                {label: '5', value: 5},
                {label: '10', value: 10},
                {label: '25', value: 25},
                {label: '50', value: 50},
                {label: '100', value: 100}
            ];

            this.donate = function() {
                params.donate(this.amount, this.currency.value);
            }.bind(this);

            this.upgrade = function() {
                params.upgrade();
            };

            this.close = function() {
                params.close();
            };
        }
    });
})

.factory('aliasModal', function(pmModal, Address, networkActivityTracker, notify) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/alias.tpl.html',
        controller: function(params) {
            // Variables
            this.local = '';
            this.members = params.members;
            this.member = params.members[0]; // TODO in the future we should add a select to choose a member
            this.domains = [];

            _.each(params.domains, function(domain) {
                this.domains.push({label: domain, value: domain});
            }.bind(this));

            this.domain = this.domains[0];

            // Functions
            this.add = function() {
                networkActivityTracker.track(
                    Address.create({
                        Local: this.local,
                        Domain: this.domain.value,
                        MemberID: this.member.ID
                    })
                    .then(function(result) {
                        if (result.data && result.data.Code === 1000) {
                            params.add(result.data.Address);
                        } else if (result.data && result.data.Error) {
                            notify({message: result.data.Error, classes: 'notification-danger'});
                        }
                    }.bind(this))
                );
            }.bind(this);

            this.cancel = function() {
                params.cancel();
            };
        }
    });
})

// edit address modal
.factory('identityModal', function(pmModal, authentication) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/identity.tpl.html',
        controller: function(params) {
            this.defaultDisplayName = authentication.user.DisplayName;
            this.defaultSignature = authentication.user.Signature;
            this.address = params.address;
            this.address.DisplayName = this.address.DisplayName || authentication.user.DisplayName;
            this.address.Signature = this.address.Signature || authentication.user.Signature;
            this.address.custom = true;

            this.confirm = function() {
                params.confirm(this.address);
            };

            this.cancel = function() {
                params.cancel();
            };
        }
    });
})

.factory('welcomeModal', function(pmModal, Setting, authentication, networkActivityTracker, $q) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/welcome.tpl.html',
        controller: function(params) {
            this.displayName = authentication.user.DisplayName;

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            this.next = function() {
                var promises = [];

                if (this.displayName.length > 0) {
                    promises.push(Setting.display({'DisplayName': this.displayName}).$promise);
                    authentication.user.DisplayName = this.displayName;
                }

                networkActivityTracker.track($q.all(promises).then(function() {
                    if (angular.isDefined(params.next) && angular.isFunction(params.next)) {
                        params.next(this.displayName);
                    }
                }.bind(this)));
            }.bind(this);
        }
    });
});
