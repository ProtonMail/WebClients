angular.module('proton.routes', [
    'ui.router',
    'proton.authentication',
    'proton.constants',
    'proton.storage'
])

.config(function($stateProvider, $urlRouterProvider, $locationProvider, CONSTANTS) {
    var conversationParameters = function() {
      var parameters = [
        'email',
        'address',
        'page',
        'filter',
        'sort',
        'label',
        'from',
        'to',
        'subject',
        'keyword',
        'begin',
        'end',
        'attachments',
        'starred',
        'reload'
      ];

      return parameters.join('&');
    };

    $stateProvider

    // ------------
    // LOGIN ROUTES
    // ------------
    .state('login', {
        url: '/login',
        views: {
            'main@': {
                templateUrl: 'templates/layout/login.tpl.html'
            },
            'panel@login': {
                controller: 'LoginController',
                templateUrl: 'templates/views/login.tpl.html'
            }
        }
    })

    .state('login.unlock', {
        url: '/unlock',
        views: {
            'panel@login': {
                controller: 'LoginController',
                templateUrl: 'templates/views/unlock.tpl.html'
            }
        },
        onEnter: function($rootScope, $state, authentication) {
            if (!$rootScope.isLoggedIn) {
                authentication.logout(true);
            }

            setTimeout( function() {
                $( '[type=password]' ).focus();
            }, 200);
        }
    })

    // -------------------------------------------
    // ACCOUNT ROUTES
    // -------------------------------------------
    .state('account', {
        url: '/account/:username/:token',
        resolve: {
            app: function($stateParams, $state, $q, User) {
                var defer = $q.defer();

                User.checkInvite({
                    username: $stateParams.username,
                    token: $stateParams.token
                }).$promise.then(function(response) {
                    defer.resolve();
                }, function(response) {
                    defer.reject(response);
                });

                return defer.promise;
            }
        },
        views: {
            'main@': {
                controller: 'SetupController',
                templateUrl: 'templates/layout/auth.tpl.html'
            },
            'panel@account': {
                templateUrl: 'templates/views/sign-up.tpl.html'
            }
        }
    })

    .state('pre-invite', {
        url: '/pre-invite/:user/:token',
        views: {
            'main@': {
                templateUrl: 'templates/layout/pre.tpl.html'
            }
        },
        onEnter($state, $stateParams, $rootScope, notify, Invite) {
            const token = $stateParams.token;
            const username = $stateParams.user;

            $rootScope.loggingOut = false;

            Invite.check(token, username)
            .then((result) => {
                if (result.data && result.data.Valid === 1) {
                    $rootScope.allowedNewAccount = true;
                    $rootScope.inviteToken = $stateParams.token;
                    $rootScope.preInvited = true;
                    $rootScope.username = $stateParams.user;
                    $state.go('subscription');
                } else if (result.data && result.data.Error) {
                    notify({message: result.data.Error, classes: 'notification-danger'});
                    $state.go('login');
                } else {
                    notify({message: 'Invalid Invite Link.', classes: 'notification-danger'});
                    $state.go('login');
                }
            });
        }
    })

    .state('invite', {
        url: '/invite',
        resolve: {
            direct: function($http, $q, $state, $rootScope, url, User) {
                var deferred = $q.defer();

                if (!$rootScope.preInvited) {
                    User.direct()
                    .then(function(result) {
                        if (result.data && result.data.Code === 1000) {
                            if (result.data.Direct === 1) {
                                $state.go('subscription');
                                deferred.resolve();
                            } else {
                                window.location.href = 'https://protonmail.com/invite';
                                deferred.reject();
                            }
                        } else {
                            $state.go('login');
                            deferred.reject();
                        }
                    });
                } else {
                    deferred.resolve();
                }

                return deferred.promise;
            }
        }
    })

    .state('reset-theme', {
        url:  '/reset-theme',
        resolve: {
            reset: function(networkActivityTracker, Setting, notify, eventManager, gettextCatalog) {
                networkActivityTracker.track(
                    Setting.theme({Theme: '' })
                    .then(function(result) {
                        if (result.data && result.data.Code === 1000) {
                            notify({message: gettextCatalog.getString('Theme reset! Redirecting...', null), classes: 'notification-success'});
                            eventManager.call().then(function() {
                                deferred.resolve();
                            });
                        } else if (result.data && result.data.Error) {
                            notify({message: result.data.Error, classes: 'notification-danger'});
                            deferred.reject();
                        } else {
                            notify({message: gettextCatalog.getString('Unable to reset theme', null, 'Error'), classes: 'notification-danger'});
                            deferred.reject();
                        }
                    })
                );
            }
        },
        onEnter: function($state) {
            $state.go('secured.inbox');
            return;
        }
    })

    .state('subscription', {
        url: '/create/new?plan&billing&currency',
        params: {
            plan: null, // 'free' / 'plus' / 'visionary'
            billing: null, // 1 / 12
            currency: null // 'CHF' / 'EUR' / 'USD'
        },
        views: {
            'main@': {
                controller: 'SignupController',
                templateUrl: 'templates/layout/auth.tpl.html'
            },
            'panel@subscription': {
                templateUrl: 'templates/views/subscription.tpl.html'
            }
        },
        resolve: {
            plans: function(direct, $q, $stateParams, Payment) {
                var deferred = $q.defer();
                var currencies = ['USD', 'EUR', 'CHF'];
                var cycles = ['1', '12'];
                var plans = ['free', 'plus', 'visionary'];
                var currency = $stateParams.currency;
                var cycle = $stateParams.billing;
                var plan = $stateParams.plan;

                if (cycles.indexOf(cycle) !== -1 && currencies.indexOf(currency) !== -1 && plans.indexOf(plan) !== -1) {
                    if (plan === 'free') {
                        deferred.resolve([]);
                    } else {
                        Payment.plans(currency, cycle)
                        .then(function(result) {
                            if (result.data && result.data.Code === 1000) {
                                deferred.resolve(result.data.Plans);
                            } else {
                                deferred.reject();
                            }
                        });
                    }
                } else {
                    deferred.resolve([]);
                }

                return deferred.promise;
            },
            domains: function(direct, $q, Domain) {
                var deferred = $q.defer();

                Domain.available().then(function(result) {
                    if (result.data && angular.isArray(result.data.Domains)) {
                        deferred.resolve(result.data.Domains);
                    } else {
                        deferred.reject();
                    }
                }, function() {
                    deferred.reject();
                });

                return deferred.promise;
            },
            direct: function($q, $state, $rootScope, User) {
                var deferred = $q.defer();

                if (!$rootScope.preInvited) {
                    User.direct()
                    .then(function(result) {
                        if (result.data && result.data.Code === 1000) {
                            if (result.data.Direct === 1) {
                                deferred.resolve(result.data);
                            } else {
                                window.location.href = 'https://protonmail.com/invite';
                                deferred.reject();
                            }
                        } else {
                            $state.go('login');
                            deferred.reject();
                        }
                    });
                } else {
                    deferred.resolve();
                }

                return deferred.promise;
            }
        }
    })

    // Reset Mailbox Password
    .state('reset', {
        url: '/reset',
        views: {
            'main@': {
                controller: 'SetupController',
                templateUrl: 'templates/layout/auth.tpl.html'
            },
            'panel@reset': {
                templateUrl: 'templates/views/reset-mailbox-password.tpl.html'
            }
        },
        onEnter: function($rootScope, $state, $log) {
            if (!$rootScope.isLoggedIn) {
                $log.debug('reset.onEnter:1');
                $state.go('login');
                return;
            }
        }
    })

    // -------------------------------------------
    // UPGRADE ROUTES
    // -------------------------------------------
    .state('upgrade', {
        url: '/upgrade',
        views: {
            'main@': {
                templateUrl: 'templates/layout/auth.tpl.html'
            },
            'panel@upgrade': {
                controller: 'UpgradeController',
                templateUrl: 'templates/views/upgrade.tpl.html'
            }
        }
    })

    // -------------------------------------------
    // SUPPORT ROUTES
    // -------------------------------------------
    .state('support', {
        url: '/help',
        views: {
            'main@': {
                controller: 'SupportController',
                templateUrl: 'templates/layout/auth.tpl.html'
            }
        }
    })

    // Generic Message View Template
    .state('support.message', {
        params: {
            data: null
        }, // Tip to avoid passing parameters in the URL
        url: '/message',
        onEnter: function($state, $stateParams) {
            if ($stateParams.data === null) {
                $state.go('login');
            }
        },
        views: {
            'panel@support': {
                templateUrl: 'templates/views/support-message.tpl.html'
            }
        }
    })

    // Reset Login Password
    .state('support.reset-password', {
        url: '/reset-login-password',
        views: {
            'panel@support': {
                templateUrl: 'templates/views/reset-login-password.tpl.html'
            }
        }
    })

    // -------------------------------------------
    // ENCRYPTION OUTSIDE
    // -------------------------------------------
    .state('eo', {
        abstract: true,
        views: {
            'main@': {
                templateUrl: 'templates/layout/outside.tpl.html'
            }
        }
    })

    .state('eo.unlock', {
        url: '/eo/:tag',
        resolve: {
            encryptedToken: function(Eo, $stateParams) {
                return Eo.token($stateParams.tag);
            }
        },
        views: {
            'content': {
                templateUrl: 'templates/views/outside.unlock.tpl.html',
                controller: function($scope, $state, $stateParams, pmcw, encryptedToken, networkActivityTracker, notify, secureSessionStorage) {
                    $scope.params = {};
                    $scope.params.MessagePassword = '';

                    if(encryptedToken.data.Error) {
                        $scope.tokenError = true;
                    } else {
                        $scope.tokenError = false;
                        encryptedToken = encryptedToken.data.Token;
                    }

                    $scope.trying = false;
                    $scope.tryPass = '';

                    $scope.unlock = function() {

                        if ($scope.trying !== true) {

                            $scope.trying = true;

                            clearTimeout($scope.tryPass);

                            $scope.tryPass = setTimeout( function() {
                                var promise = pmcw.decryptMessage(encryptedToken, $scope.params.MessagePassword);

                                promise.then(function(decryptedToken) {
                                    secureSessionStorage.setItem('proton:decrypted_token', decryptedToken);
                                    secureSessionStorage.setItem('proton:encrypted_password', pmcw.encode_utf8_base64($scope.params.MessagePassword));
                                    $state.go('eo.message', {tag: $stateParams.tag});
                                    $scope.trying = false;
                                }, function(err) {
                                    notify({message: err.message, classes: 'notification-danger'});
                                    $scope.trying = false;
                                });
                            }, 600);

                        }

                    };
                }
            }
        }
    })

    .state('eo.message', {
        url: '/eo/message/:tag',
        resolve: {
            message: function($stateParams, $q, Eo, Message, pmcw, secureSessionStorage) {
                var deferred = $q.defer();
                var token_id = $stateParams.tag;
                var decrypted_token = secureSessionStorage.getItem('proton:decrypted_token');
                var password = pmcw.decode_utf8_base64(secureSessionStorage.getItem('proton:encrypted_password'));

                Eo.message(decrypted_token, token_id)
                .then(function(result) {
                    var message = result.data.Message;
                    var promises = [];

                    promises.push(pmcw.decryptMessageRSA(message.Body, password, message.Time).then(function(body) {
                        message.DecryptedBody = body;
                    }));

                    _.each(message.Replies, function(reply) {
                        promises.push(pmcw.decryptMessageRSA(reply.Body, password, reply.Time).then(function(body) {
                            reply.DecryptedBody = body;
                        }));
                    });

                    $q.all(promises).then(function() {
                        deferred.resolve(new Message(message));
                    });
                });

                return deferred.promise;
            }
        },
        views: {
            'content': {
                controller: 'OutsideController',
                templateUrl: 'templates/views/outside.message.tpl.html'
            }
        }
    })

    .state('eo.reply', {
        url: '/eo/reply/:tag',
        resolve: {
            message: function($stateParams, $q, Eo, Message, pmcw, secureSessionStorage) {
                var deferred = $q.defer();
                var token_id = $stateParams.tag;
                var decrypted_token = secureSessionStorage.getItem('proton:decrypted_token');
                var password = pmcw.decode_utf8_base64(secureSessionStorage.getItem('proton:encrypted_password'));

                Eo.message(decrypted_token, token_id)
                .then(function(result) {
                    var message = result.data.Message;

                    message.publicKey = result.data.PublicKey; // The sender’s public key
                    pmcw.decryptMessageRSA(message.Body, password, message.Time)
                    .then(function(body) {
                        var attachments = _.filter(message.Attachments, (attachment) => { return attachment.Headers && (attachment.Headers['content-id'] || attachment.Headers['content-location']); });

                        message.DecryptedBody = body;
                        message.Attachments = attachments;
                        message.NumAttachments = attachments.length;
                        deferred.resolve(new Message(message));
                    });
                });

                return deferred.promise;
            }
        },
        views: {
            'content': {
                controller: 'OutsideController',
                templateUrl: 'templates/views/outside.reply.tpl.html'
            }
        },
        onEnter: function(gettextCatalog) {
            window.onbeforeunload = function() {
                return gettextCatalog.getString('By leaving now, you will lose what you have written in this email. You can save a draft if you want to come back to it later on.', null);
            };
        },
        onExit: function() {
            window.onbeforeunload = undefined;
        }
    })

    // -------------------------------------------
    // SECURED ROUTES
    // this includes everything after login/unlock
    // -------------------------------------------

    .state('secured', {
        // This is included in every secured.* sub-controller
        abstract: true,
        views: {
            'main@': {
                controller: 'SecuredController',
                templateUrl: 'templates/layout/secured.tpl.html'
            }
        },
        resolve: {
            // Contains also labels and contacts
            user: function(authentication, $http, pmcw, secureSessionStorage) {
                if (Object.keys(authentication.user).length > 0) {
                    return authentication.user;
                } else {
                    if(angular.isDefined(secureSessionStorage.getItem(CONSTANTS.OAUTH_KEY+':SessionToken'))) {
                        $http.defaults.headers.common['x-pm-session'] = pmcw.decode_base64(secureSessionStorage.getItem(CONSTANTS.OAUTH_KEY+':SessionToken'));
                    }

                    return authentication.fetchUserInfo(); // TODO need to rework this just for the locked page
                }
            },
            organization: function($q, user, Organization) {
                var deferred = $q.defer();

                if (user.Role > 0) {
                    Organization.get()
                    .then(function(result) {
                        if (result.data && result.data.Code === 1000) {
                            deferred.resolve(result.data.Organization);
                        }
                    });
                } else {
                    deferred.resolve({
                        PlanName: 'free'
                    });
                }

                return deferred.promise;
            }
        },
        onEnter: function($rootScope, authentication, $timeout, CONSTANTS) {
            // This will redirect to a login step if necessary
            delete $rootScope.tempUser;
            authentication.redirectIfNecessary();
        }
    })

    .state('printer', {
        params: {messageID: null},
        url: '/printer/:messageID',
        resolve: {
            messageID($stateParams) {
                if ($stateParams.messageID) {
                    return Promise.resolve($stateParams.messageID);
                } else {
                    return Promise.reject();
                }
            }
        },
        views: {
            'main@': {
                templateUrl: 'templates/views/message.print.tpl.html',
                controller: function($scope, $state, $rootScope, $sce, $timeout, messageID) {
                    $rootScope.isBlank = true;
                    $scope.loading = true;

                    if (window.opener) {
                        const url = window.location.href;
                        const arr = url.split('/');
                        const targetOrigin = arr[0] + '//' + arr[2];

                        window.addEventListener('message', printMessage, false);
                        window.opener.postMessage(messageID, targetOrigin);
                    }

                    function printMessage(event) {
                        const message = JSON.parse(event.data);

                        if (message.ID === messageID) {
                            $scope.$applyAsync(() => {
                                $scope.content = $sce.trustAsHtml(message.content);
                                $scope.message = message;
                                $scope.loading = false;
                            });

                            window.removeEventListener('message', this);
                            $timeout(() => {
                                window.print();
                            }, 2000, false);
                        }
                    }
                }
            }
        }
    })

    .state('secured.contacts', {
        url: '/contacts',
        resolve: {
            delinquent: function($q, $state, gettextCatalog, user, notify, authentication) {
                var deferred = $q.defer();

                if (authentication.user.Delinquent < 3) {
                    deferred.resolve();
                } else {
                    notify({message: gettextCatalog.getString('Your account currently has an overdue invoice. Please pay all unpaid invoices.', null, 'Info'), classes: 'notification-danger'});
                    $state.go('secured.payments');
                    deferred.reject();
                }

                return deferred.promise;
            }
        },
        views: {
            'content@secured': {
                templateUrl: 'templates/views/contacts.tpl.html',
                controller: 'ContactsController'
            }
        }
    })

    .state('secured.account', {
        url: '/account',
        views: {
            'content@secured': {
                templateUrl: 'templates/views/account.tpl.html',
                controller: 'AccountController'
            }
        }
    })

    .state('secured.labels', {
        url: '/labels',
        views: {
            'content@secured': {
                templateUrl: 'templates/views/labels.tpl.html',
                controller: 'LabelsController'
            }
        }
    })

    .state('secured.security', {
        url: '/security',
        views: {
            'content@secured': {
                templateUrl: 'templates/views/security.tpl.html',
                controller: 'SecurityController'
            }
        }
    })


    .state('secured.appearance', {
        url: '/appearance',
        views: {
            'content@secured': {
                templateUrl: 'templates/views/appearance.tpl.html',
                controller: 'AppearanceController'
            }
        }
    })

    .state('secured.addresses', {
        url: '/addresses',
        views: {
            'content@secured': {
                templateUrl: 'templates/views/addresses.tpl.html',
                controller: 'AddressesController'
            }
        }
    })

    .state('secured.payments', {
        url: '/payments',
        views: {
            'content@secured': {
                templateUrl: 'templates/views/payments.tpl.html',
                controller: 'PaymentsController'
            }
        },
        resolve: {
            invoices: function(Payment, networkActivityTracker) {
                return networkActivityTracker.track(Payment.invoices());
            },
            methods: function(Payment, networkActivityTracker) {
                return networkActivityTracker.track(Payment.methods());
            }
        }
    })

    .state('secured.keys', {
        url: '/keys',
        resolve: {
            access: function(user, $q) {
                var deferred = $q.defer();

                if(user.Role === 2) {
                    deferred.resolve();
                } else {
                    deferred.reject();
                }

                return deferred.promise;
            }
        },
        views: {
            'content@secured': {
                templateUrl: 'templates/views/keys.tpl.html',
                controller: 'KeysController'
            }
        }
    })

    .state('secured.dashboard', {
        url: '/dashboard',
        params: {
            scroll: null
        },
        resolve: {
            access: function(user, $q) {
                var deferred = $q.defer();

                if(user.Role === 0 || user.Role === 2) {
                    deferred.resolve();
                } else {
                    deferred.reject();
                }

                return deferred.promise;
            },
            // Return yearly plans
            yearly: function(user, Payment, networkActivityTracker) {
                return networkActivityTracker.track(Payment.plans(user.Currency, 12));
            },
            // Return monthly plans
            monthly: function(user, Payment, networkActivityTracker) {
                return networkActivityTracker.track(Payment.plans(user.Currency, 1));
            },
            subscription: function(user, Payment, networkActivityTracker) {
                return networkActivityTracker.track(Payment.subscription());
            },
            methods: function(user, Payment, networkActivityTracker) {
                return networkActivityTracker.track(Payment.methods());
            },
            status: function(user, Payment, networkActivityTracker) {
                return networkActivityTracker.track(Payment.status());
            }
        },
        views: {
            'content@secured': {
                templateUrl: 'templates/views/dashboard.tpl.html',
                controller: 'DashboardController'
            }
        }
    })

    .state('secured.members', {
        url: '/members',
        resolve: {
            access: function(user, $q) {
                var deferred = $q.defer();

                if(user.Role === 2) {
                    deferred.resolve();
                } else {
                    deferred.reject();
                }

                return deferred.promise;
            },
            members: function(Member, networkActivityTracker) {
                return networkActivityTracker.track(Member.query());
            },
            domains: function(Domain, networkActivityTracker) {
                return networkActivityTracker.track(Domain.query());
            }
        },
        views: {
            'content@secured': {
                templateUrl: 'templates/views/members.tpl.html',
                controller: 'MembersController'
            }
        }
    })

    .state('secured.domains', {
        url: '/domains',
        resolve: {
            members: function($q, user, Member, networkActivityTracker) {
                var deferred = $q.defer();

                if (user.Role === 2) {
                    Member.query()
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            deferred.resolve(result.data.Members);
                        }
                    });
                } else {
                    deferred.resolve([]);
                }

                return networkActivityTracker.track(deferred.promise);
            },
            domains: function($q, user, Domain, networkActivityTracker) {
                var deferred = $q.defer();

                if (user.Role === 2) {
                    Domain.query()
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            deferred.resolve(result.data.Domains);
                        }
                    });
                } else {
                    deferred.resolve([]);
                }

                return networkActivityTracker.track(deferred.promise);
            }
        },
        views: {
            'content@secured': {
                templateUrl: 'templates/views/domains.tpl.html',
                controller: 'DomainsController'
            }
        }
    })

    .state('secured.filters', {
        url: '/filters',
        resolve: {
            customFilters: function($q, Filter, networkActivityTracker) {
                var deferred = $q.defer();

                Filter.query()
                .then(function(result) {
                    if (result.data && result.data.Code === 1000) {
                        deferred.resolve(result.data.Filters);
                    } else {
                        deferred.reject();
                    }
                });

                return networkActivityTracker.track(deferred.promise);
            },
            incomingDefaults: function($q, IncomingDefault, networkActivityTracker) {
                var deferred = $q.defer();

                IncomingDefault.get()
                .then(function(result) {
                    if (result.data && result.data.Code === 1000) {
                        deferred.resolve(result.data.IncomingDefaults);
                    } else {
                        deferred.reject();
                    }
                });

                return networkActivityTracker.track(deferred.promise);
            },
        },
        views: {
            'content@secured': {
                templateUrl: 'templates/views/filters.tpl.html',
                controller: 'FiltersController'
            }
        }
    });

    _.each(CONSTANTS.MAILBOX_IDENTIFIERS, function(id, box) {
        var parentState = 'secured.' + box;
        var conversationState = 'secured.' + box + '.conversation';
        var messageState = 'secured.' + box + '.message';
        var conversationView = {};
        var messageView = {};
        var list = {};

        list['content@secured'] = {
            controller: 'ElementsController',
            templateUrl: 'templates/partials/conversations.tpl.html'
        };

        conversationView['view@secured.' + box] = {
            controller: 'ConversationController',
            templateUrl: 'templates/partials/conversation.tpl.html',
            resolve: {
                conversation($stateParams, cache) {
                    return cache.getConversation($stateParams.id);
                }
            }
        };

        messageView['view@secured.' + box] = {
            template: `<message-view></message-view>`
        };

        $stateProvider.state(parentState, {
            url: '/' + box + '?' + conversationParameters(),
            views: list,
            resolve: {
                delinquent: function($q, $state, gettextCatalog, user, notify, authentication) {
                    var deferred = $q.defer();

                    if (authentication.user.Delinquent < 3) {
                        deferred.resolve();
                    } else {
                        notify({message: gettextCatalog.getString('Your account currently has an overdue invoice. Please pay all unpaid invoices.', null, 'Info'), classes: 'notification-danger'});
                        $state.go('secured.payments');
                        deferred.reject();
                    }

                    return deferred.promise;
                }
            },
            onExit: function($rootScope) {
                $rootScope.showWelcome = false;
            }
        });

        $stateProvider.state(conversationState, {
            url: '/c/{id}',
            params: {
                id: '',
                message: null
            },
            views: conversationView,
            onExit: function($rootScope) {
                $rootScope.$broadcast('unactiveMessages');
                $rootScope.$broadcast('unmarkMessages');
            }
        });

        $stateProvider.state(messageState, {
            url: '/m/{id}',
            params: {
                id: ''
            },
            views: messageView
        });
    });

    $urlRouterProvider.otherwise(function($injector) {
        var $state = $injector.get('$state');
        var stateName = $injector.get('authentication').state() || 'secured.inbox';

        return $state.href(stateName);
    });

    $locationProvider.html5Mode(true);
});
