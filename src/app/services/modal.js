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

            if(angular.isDefined(params.alert)) {
                this.alert = params.alert;
            } else {
                this.alert = 'alert-info';
            }

            this.ok = function() {
                if (angular.isDefined(params.ok) && angular.isFunction(params.ok)) {
                    params.ok();
                }
            };
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/alert.tpl.html'
    });
})

// Advance search modal
.factory('searchModal', function(pmModal, authentication, CONSTANTS) {
    return pmModal({
        templateUrl: 'templates/modals/advanceSearch.tpl.html'
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
.factory('cardModal', function(pmModal, Payment, notify, pmcw, tools, $translate, $window) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/card.tpl.html',
        controller: function(params) {
            // Variables
            this.cardTypeIcon = 'fa-credit-card';
            this.status = params.card.Status;
            this.brand = params.card.Brand;
            this.number = '•••• •••• •••• ' + params.card.Last4;
            this.fullname = params.card.Name;
            this.month = params.card.ExpMonth;
            this.year = params.card.ExpYear;
            this.cvc = '•••';
            this.zip = params.card.ZIP;
            this.countries = tools.countries;
            this.country = _.findWhere(this.countries, {value: params.Country});
            this.change = false;
            // Functions
            this.submit = function() {
                this.process = true;

                var stripeResponseHandler = function(status, response) {
                    if(status === 200) {
                        pmcw.encryptMessage(angular.toJson({
                            Source: {
                                Object: 'card',
                                Number: this.number,
                                ExpMonth: this.month,
                                ExpYear: this.year,
                                CVC: this.cvc,
                                Name: this.fullname,
                                Country: this.country.value,
                                ZIP: this.zip
                            }
                        }), params.key).then(function(metadata) {
                            // Send request to change credit card
                            Payment.change({
                                Source: {
                                    Metadata: metadata,
                                    Object: 'token',
                                    Token: response.id,
                                    ExternalSourceID: params.card.ExternalSourceID
                                }
                            }).then(function(result) {
                                if(angular.isDefined(result.data) && result.data.Code === 1000) {
                                    notify({message: $translate.instant('CREDIT_CARD_CHANGED'), classes: 'notification-success'});
                                    params.cancel();
                                } else if(angular.isDefined(result.data) && angular.isDefined(result.data.Error)) {
                                    this.process = false;
                                    notify({message: result.data.Error, classes: 'notification-danger'});
                                } else {
                                    this.process = false;
                                    notify({message: $translate.instant('ERROR_DURING_CARD_REQUEST'), classes: 'notification-danger'});
                                }
                            }.bind(this), function(error) {
                                this.process = false;
                                notify({message: $translate.instant('ERROR_DURING_CARD_REQUEST'), classes: 'notification-danger'});
                            }.bind(this));
                        }.bind(this));
                    } else if(angular.isDefined(response.error)) {
                        notify({message: response.error.message, classes: 'notification-danger'});
                        this.process = false;
                    }
                }.bind(this);

                if($window.Stripe.card.validateCardNumber(this.number) === false) {
                    notify({message: $translate.instant('CARD_NUMER_INVALID'), classes: 'notification-danger'});
                    this.process = false;
                    return false;
                }

                if($window.Stripe.card.validateExpiry(this.month, this.year) === false) {
                    notify({message: $translate.instant('EXPIRY_INVALID'), classes: 'notification-danger'});
                    this.process = false;
                    return false;
                }

                if($window.Stripe.card.validateCVC(this.cvc) === false) {
                    notify({message: $translate.instant('CVC_INVALID'), classes: 'notification-danger'});
                    this.process = false;
                    return false;
                }

                $window.Stripe.card.createToken({
                    name: this.fullname,
                    number: this.number,
                    cvc: this.cvc,
                    exp_month: this.month,
                    exp_year: this.year,
                    address_country: this.country.value,
                    address_zip: this.zip
                }, stripeResponseHandler);
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
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
            // Variables
            this.process = false;
            this.change = false;
            this.step = 'payment';
            this.number = '';
            this.fullname = '';
            this.month = '';
            this.year = '';
            this.cvc = '';
            this.zip = '';
            this.cardTypeIcon = 'fa-credit-card';
            this.config = params.configuration;
            this.recovery = '';
            this.create = params.create;
            this.base = CONSTANTS.BASE_SIZE;
            this.coupon = false;
            this.countries = tools.countries;
            this.country = _.findWhere(this.countries, {value: 'US'});

            if(angular.isDefined(params.card)) {
                this.source = params.card.ExternalSourceID;
                this.number = '•••• •••• •••• ' + params.card.Last4;
                this.fullname = params.card.Name;
                this.month = params.card.ExpMonth;
                this.year = params.card.ExpYear;
                this.cvc = '•••';
                this.change = false;
                this.country = _.findWhere(this.countries, {value: params.card.Country});
                this.zip = params.card.ZIP;
            }

            // Functions
            var saveOrganization = function() {
                var promise;

                if(params.create === true) {
                    // Create
                    promise = Organization.create(this.config);
                } else {
                    // Update
                    promise = Organization.update(this.config);
                }

                promise.then(function(result) {
                    if(angular.isDefined(result.data) && result.data.Code === 1000) {
                        this.step = 'thanks';
                        params.change(result.data.Organization);
                    } else if(angular.isDefined(result.data) && angular.isDefined(result.data.Error)) {
                        this.step = 'payment';
                        notify({message: result.data.Error, classes: 'notification-danger'});
                    } else {
                        this.step = 'payment';
                        notify({message: $translate.instant('ERROR_DURING_ORGANIZATION_REQUEST'), classes: 'notification-danger'});
                    }
                }.bind(this), function(error) {
                    this.step = 'payment';
                    // TODO notify
                }.bind(this));
            }.bind(this);

            /**
             * Encrypt metadata with public key
             */
            var encryptMetadata = function() {
                var deferred = $q.defer();
                var data = {
                    Source: {
                        Object: 'card',
                        Number: this.number,
                        ExpMonth: this.month,
                        ExpYear: this.year,
                        CVC: this.cvc,
                        Name: this.fullname,
                        Country: this.country.value,
                        ZIP: this.zip
                    }
                };

                pmcw.encryptMessage(angular.toJson(data), params.key).then(function(result) {
                    this.config.Source.Metadata = result;
                    deferred.resolve();
                }.bind(this));

                return deferred.promise;
            }.bind(this);

            /**
             * Generate token with Stripe library
             */
            var generateStripeToken = function() {
                if($window.Stripe.card.validateCardNumber(this.number) === false) {
                    notify({message: $translate.instant('CARD_NUMER_INVALID'), classes: 'notification-danger'});
                    this.step = 'payment';
                    return false;
                }

                if($window.Stripe.card.validateExpiry(this.month, this.year) === false) {
                    notify({message: $translate.instant('EXPIRY_INVALID'), classes: 'notification-danger'});
                    this.step = 'payment';
                    return false;
                }

                if($window.Stripe.card.validateCVC(this.cvc) === false) {
                    notify({message: $translate.instant('CVC_INVALID'), classes: 'notification-danger'});
                    this.step = 'payment';
                    return false;
                }

                // Generate token with Stripe Api
                $window.Stripe.card.createToken({
                    name: this.fullname,
                    number: this.number,
                    cvc: this.cvc,
                    exp_month: this.month,
                    exp_year: this.year,
                    address_country: this.country.value,
                    address_zip: this.zip
                }, stripeResponseHandler);
            }.bind(this);

            /**
             * Callback called by the Stripe library when the token is generated
             */
            var stripeResponseHandler = function(status, response) {
                if(status === 200) {
                    // Add data from Stripe
                    this.config.Source = {
                        Object: 'token',
                        Token: response.id
                    };

                    if(angular.isDefined(this.source)) {
                        this.config.Source.ExternalSourceID = this.source;
                    }

                    // Encrypt metadata
                    encryptMetadata().then(function() {
                        // Send request to subscribe
                        saveOrganization();
                    });
                } else if(angular.isDefined(response.error)) {
                    notify({message: response.error.message, classes: 'notification-danger'});
                    this.step = 'payment';
                } else {
                    this.step = 'payment';
                }
            }.bind(this);

            this.submit = function() {
                var next = function() {
                    if(this.change === true) {
                        generateStripeToken();
                    } else {
                        saveOrganization();
                    }
                }.bind(this);

                // Change process status true to disable input fields
                this.step = 'process';

                if (params.create === true) {
                    // if (this.recovery.length > 0) {
                        var oldMailPwd = authentication.getPassword();
                        // var newMailPwd = this.recovery;

                        pmcw.generateKeysRSA('pm_org_admin', oldMailPwd).then(
                            function(response) {
                                var privateKey = response.privateKeyArmored;
                                // TODO We keep this code if Andy decide to come back to the recovery field
                                // var backupPrivateKey = pmcw.getNewEncPrivateKey(privateKey, oldMailPwd, newMailPwd);

                                // if (backupPrivateKey === -1) {
                                //     notify({message: $translate.instant('WRONG_CURRENT_MAILBOX_PASSWORD'), classes: 'notification-danger'});
                                //     this.step = 'payment';
                                // } else if (Error.prototype.isPrototypeOf(backupPrivateKey)) {
                                //     // Error messages from OpenPGP.js
                                //     notify({message: backupPrivateKey.message, classes: 'notification-danger'});
                                //     this.step = 'payment';
                                // } else {
                                    this.config.Organization.PrivateKey = privateKey;
                                    this.config.Organization.BackupPrivateKey = privateKey;
                                    next();
                                // }
                            }.bind(this),
                            function(error) {
                                $log.error(error);
                                notify({message: 'Error during the generation of new keys for pm_org_admin', classes: 'notification-danger'});
                                this.step = 'payment';
                            }.bind(this)
                        );
                    // } else {
                    //     notify({message: 'You need to enter a recovery organization password', classes: 'notification-danger'});
                    //     this.step = 'payment';
                    //     return false;
                    // }
                } else {
                    next();
                }


            }.bind(this);

            /**
             * Apply the coupon field
             */
            this.apply = function() {
                Payment.coupons(this.config.Coupon, {
                    BillingCycle: this.config.Subscription.BillingCycle,
                    Currency: this.config.Subscription.Currency
                }).then(function(result) {
                    if (result.data && result.data.Code === 1000) {
                        // Apply coupon off
                        this.coupon = result.data.Modifier.AmountOff;
                    }
                }.bind(this));
            };

            this.total = function() {
                var value = this.config.Subscription.Amount - this.coupon;

                if (value > 0) {
                    return value / 100;
                } else {
                    return 0;
                }
            };

            this.monthly = function() {
                params.monthly();
            };

            this.yearly = function() {
                params.yearly();
            };

            /**
             * Close payment modal
             */
            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
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

.factory('addressModal', function(pmModal, $rootScope, networkActivityTracker, notify, Address, $translate) {
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
                if (angular.isDefined(params.add) && angular.isFunction(params.add)) {
                    params.add(this.address, this.member);
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
            this.submit = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.submit();
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
            this.submit = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.submit();
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
            this.submit = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.submit();
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
            this.submit = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.submit();
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

.factory('generateModal', function(pmModal, networkActivityTracker, Key, pmcw, authentication, notify) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/generate.tpl.html',
        controller: function(params) {
            // Variables
            var mailboxPassword = authentication.getPassword();
            var promises = [];
            var DIRTY = 0;
            var ENCRYPTING = 1;
            var ENCRYPTED = 2;
            var SAVED = 3;
            var ERROR = 4;

            // Parameters
            this.process = false;
            this.addresses = params.addresses;
            this.title = params.title;
            this.message = params.message;
            _.each(this.addresses, function(address) { address.state = DIRTY; });
            this.sizes = [{label: 'normal strength encryption (2048)', value: 2048}, {label: 'high strength encryption (4096)', value: 4096}];
            this.size = this.sizes[0];

            // Functions
            this.submit = function() {
                this.process = true;
                _.each(this.addresses, function(address) {
                    address.state = ENCRYPTING;
                    promises.push(pmcw.generateKeysRSA(
                        address.Email,
                        mailboxPassword,
                        this.size.value
                    ).then(function(result) {
                        address.state = ENCRYPTED;
                        // var publicKeyArmored = result.publicKeyArmored; not used
                        var privateKeyArmored = result.privateKeyArmored;

                        Key.create({
                            AddressID: address.ID,
                            PrivateKey: privateKeyArmored
                        }).then(function(result) {
                            if (result.data && result.data.Code === 1000) {
                                address.state = SAVED;
                                this.cancel();
                            } else if (result.data && result.data.Error) {
                                address.state = ERROR;
                                notify({message: result.data.Error, classes: 'notification-danger'});
                            } else {
                                address.state = ERROR;
                                notify({message: 'Error during create key request', classes: 'notification-danger'});
                            }
                        }.bind(this), function(error) {
                            address.state = ERROR;
                            notify({message: 'Error during the create key request', classes: 'notification-danger'});
                        });
                    }.bind(this), function(error) {
                        address.state = ERROR;
                        notify({message: error, classes: 'notification-danger'});
                    }));
                }.bind(this));
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
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

.factory('donateModal', function(pmModal, Payment, notify, tools, $translate) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/donate.tpl.html',
        controller: function(params) {
            // Load Stripe library
            tools.loadStripe();
            // Variables
            this.text = params.message || 'Donate to ProtonMail';
            this.amount = params.amount || 25;
            this.currencies = [
                {label: 'USD', value: 'USD'},
                {label: 'EUR', value: 'EUR'},
                {label: 'CHF', value: 'CHF'}
            ];
            this.currency = this.currencies[0];
            this.number = '';
            this.month = '';
            this.year = '';
            this.cvc = '';
            this.fullname = '';

            if (angular.isDefined(params.currency)) {
                var index = _.findIndex(this.currencies, {value: params.currency});

                if (index !== -1) {
                    this.currency = this.currencies[index];
                }
            }

            // Functions
            var check = function() {
                if ($window.Stripe.card.validateCardNumber(this.number) === false) {
                    throw new Error($translate.instant('CARD_NUMER_INVALID'));
                }

                if ($window.Stripe.card.validateExpiry(this.month, this.year) === false) {
                    throw new Error($translate.instant('EXPIRY_INVALID'));
                }

                if ($window.Stripe.card.validateCVC(this.cvc) === false) {
                    throw new Error($translate.instant('CVC_INVALID'));
                }
            };

            this.donate = function() {
                var now = moment().unix();

                try {
                    check();
                    Payment.donate({
                        Donation: {
                            Amount: this.amount * 100,
                            Currency: this.currency.value,
                            Time: now,
                            ExternalProvider: 'Stripe'
                        },
                        Source: {
                            Object: 'card',
                            Number: this.number,
                            ExpMonth: this.month,
                            ExpYear: this.year,
                            CVC: this.cvc,
                            Name: this.fullname
                        }
                    })
                    .then(function(result) {
                        if (result.data && result.data.Code === 1000) {
                            this.close();
                        } else if (result.data && result.data.Error) {
                            throw new Error(result.data.Error);
                        } else {
                            throw new Error($translate.instant('ERROR_DURING_DONATION_REQUEST'));
                        }
                    }.bind(this));
                } catch (error) {
                    notify({message: error, classes: 'notification-danger'});
                } finally {

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

.factory('monetizeModal', function(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/monetize.tpl.html',
        controller: function(params) {
            this.amounts = [5, 10, 25, 50, 100];
            this.currencies = ['EUR', 'USD', 'CHF'];
            this.amount = 25; // default value for the amount
            this.currency = 'USD'; // default currency

            this.donate = function() {
                if (angular.isDefined(params.donate) && angular.isFunction(params.donate)) {
                    params.donate();
                }
            };

            this.upgrade = function() {
                if (angular.isDefined(params.upgrade) && angular.isFunction(params.upgrade)) {
                    params.upgrade();
                }
            };

            this.close = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.close();
                }
            };
        }
    });
});
