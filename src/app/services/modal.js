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
        controller: function(params) {
            this.attachments = 2;
            this.starred = 2;
            this.labels = authentication.user.Labels;
            this.folders = angular.copy(CONSTANTS.MAILBOX_IDENTIFIERS);
            delete this.folders.search;
            delete this.folders.label;

            if(angular.isDefined(params.value)) {
                this.keywords = params.value;
            }

            this.setMin = function() {
                if(this.start.getDate() === null) {
                    this.start = null;
                } else {
                    this.end.setMinDate(this.start.getDate());
                }
            };

            this.setMax = function() {
                if(this.end.getDate() === null) {
                    this.end = null;
                } else {
                    this.start.setMaxDate(this.end.getDate());
                }
            };

            this.search = function() {
                if (angular.isDefined(params.search) && angular.isFunction(params.search)) {
                    var parameters = {};

                    parameters.words = this.keywords;
                    parameters.from = this.from;
                    parameters.to = this.to;
                    parameters.subject = this.subject;
                    parameters.attachments = parseInt(this.attachments);
                    parameters.starred = parseInt(this.starred);

                    if(parseInt($('#search_folder').val()) !== -1) {
                        parameters.location = parseInt($('#search_folder').val());
                    }

                    if(parseInt($('#search_label').val()) !== 0) {
                        parameters.label = $('#search_label').val();
                    }

                    if($('#search_start').val().length > 0) {
                        parameters.begin = this.start.getMoment().unix();
                    }

                    if($('#search_end').val().length > 0) {
                        parameters.end = this.end.getMoment().unix();
                    }

                    params.search(parameters);
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        },
        controllerAs: 'ctrl',
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

// contact modal
.factory('wizardModal', function(pmModal) {
    return pmModal({
        controller: function(params, $timeout) {
            this.version = params.version;
            this.title = params.title;

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/wizard.tpl.html'
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

// Stripe modal
.factory('stripeModal', function(pmModal, Stripe) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/stripe.tpl.html',
        controller: function(params) {
            this.close = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.close();
                }
            };
        }
    });
})

// Payment modal
.factory('paymentModal', function(notify, pmModal, Stripe, Payment, $translate) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/payment/modal.tpl.html',
        controller: function(params) {
            // Variables
            this.step = 'payment';
            this.number = '';
            this.fullname = '';
            this.month = '';
            this.year = '';
            this.cvc = '';
            this.currency = params.currency;
            this.billing = params.billing;
            this.process = false;
            this.cardTypeIcon = 'fa-credit-card';
            this.cart = [];

            var count = function(type) {
                var quantity = 0;

                if(angular.isDefined(params.pack)) {
                    quantity += params.pack[type];
                }

                if(angular.isDefined(params.additionals)) {
                    var element = _.findWhere(params.additionals, {type: type, checked: true});

                    if(angular.isDefined(element)) {
                        quantity += element.quantity;
                    }
                }

                return quantity;
            };

            if(angular.isDefined(params.pack)) {
                var price = params.pack.price[params.billing];

                this.cart.push({
                    number: params.pack.number,
                    quantity: params.pack.quantity,
                    title: params.pack.long,
                    price: price
                });
            }

            if(angular.isDefined(params.additionals)) {
                _.each(params.additionals, function(element) {
                    if(element.checked === true) {
                        var price = element.price[params.billing] * element.quantity;

                        this.cart.push({
                            number: element.number,
                            quantity: element.quantity,
                            title: element.long,
                            price: price
                        });
                    }
                }.bind(this));
            }

            // Functions
            this.submit = function() {
                this.process = true;

                var stripeResponseHandler = function(status, response) {
                    this.process = false;

                    if(status === 200) {
                        Payment.subscribe({
                            GroupID: '',
                            Amount: this.total(),
                            Currency: params.currency,
                            Time: Math.floor(Date.now() / 1000), // Current timestamp in seconds
                            BillingCycle: params.billing,
                            ExternalProvider: 'Stripe',
                            Source: {
                                Object: 'token',
                                Token: response.id
                            },
                            Cart: {
                                current: null,
                                future: {
                                    Use2FA: false,
                                    MaxDomains: count('domain'),
                                    MaxMembers: count('member'),
                                    MaxAddresses: count('address'),
                                    MaxSpace: count('space')
                                }
                            }
                        }).then(function(result) {
                            this.step = 'thanks';
                        }, function(error) {
                            // TODO manage error
                        });
                    } else if(angular.isDefined(response.error)) {
                        notify({message: response.error.message, classes: 'notification-danger'});
                    }
                }.bind(this);

                if(Stripe.card.validateCardNumber(this.number) === false) {
                    notify({message: $translate.instant('CARD_NUMER_INVALID'), classes: 'notification-danger'});
                    return false;
                }

                if(Stripe.card.validateExpiry(this.month, this.year) === false) {
                    notify({message: $translate.instant('EXPIRY_INVALID'), classes: 'notification-danger'});
                    return false;
                }

                if(Stripe.card.validateCVC(this.cvc) === false) {
                    notify({message: $translate.instant('CVC_INVALID'), classes: 'notification-danger'});
                    return false;
                }

                Stripe.card.createToken({
                    name: this.fullname,
                    number: this.number,
                    cvc: this.cvc,
                    exp_month: this.month,
                    exp_year: this.year
                }, stripeResponseHandler);
            };

            this.numberChange = function() {
                var type = Stripe.card.cardType(this.number);

                switch (type) {
                    case 'Visa':
                        this.cardTypeIcon = 'fa-cc-visa';
                        break;
                    case 'MasterCard':
                        this.cardTypeIcon = 'fa-cc-mastercard';
                        break;
                    case 'Discover':
                        this.cardTypeIcon = 'fa-cc-discover';
                        break;
                    case 'Diners Club':
                        this.cardTypeIcon = 'fa-cc-diners-club';
                        break;
                    case 'JCB':
                        this.cardTypeIcon = 'fa-cc-jcb';
                        break;
                    case 'American Express':
                    case 'Unknown':
                    this.cardTypeIcon = 'fa-credit-card';
                    break;
                    default:
                        this.cardTypeIcon = 'fa-credit-card';
                        break;
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            this.total = function() {
                var total = 0;

                _.each(this.cart, function(element) {
                    total += element.price;
                });

                return total;
            };
        }
    });
})

.factory('userModal', function(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/user/modal.tpl.html',
        controller: function(params) {
            // Variables
            this.step = 'address';

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

.factory('domainModal', function(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain.tpl.html',
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

.factory('addressModal', function(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/address.tpl.html',
        controller: function(params) {
            // Variables
            this.domain = params.domain;
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

.factory('verificationModal', function(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/verification.tpl.html',
        controller: function(params) {
            this.domain = params.domain;
            this.close = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.close();
                }
            };
        }
    });
})

.factory('spfModal', function(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/spf.tpl.html',
        controller: function(params) {
            this.domain = params.domain;
            this.close = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.close();
                }
            };
        }
    });
})

.factory('dkimModal', function(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/dkim.tpl.html',
        controller: function(params) {
            this.domain = params.domain;
            this.close = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.close();
                }
            };
        }
    });
})

.factory('dmarcModal', function(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/dmarc.tpl.html',
        controller: function(params) {
            this.domain = params.domain;
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
            this.form.attachScreenshot = true; // Attach screenshot by default
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
});
