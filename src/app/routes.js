angular.module('proton.routes', [
    'ui.router',
    'proton.authentication',
    'proton.constants'
])

.config(function($stateProvider, $urlRouterProvider, $locationProvider, CONSTANTS) {
    var conversationParameters = function() {
      var parameters = [
        'page',
        'filter',
        'sort',
        'label',
        'from',
        'to',
        'subject',
        'words',
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
        },
        onEnter: function(authentication, eventManager, cache) {
            // Stop event manager request
            eventManager.stop();
            // Clear cache
            cache.clear();
            // We automatically logout the user when he comes to login page
            authentication.logout(false);
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
            if ($rootScope.TemporaryEncryptedPrivateKeyChallenge === undefined) {
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
        onEnter: function($http, url, CONFIG, $state, $stateParams, $rootScope, notify, authentication) {
            // clear user data if already logged in:
            authentication.logout(false);
            $rootScope.loggingOut = false;

            $http.post( url.get() + '/users/' + $stateParams.token + '/check', { Username: $stateParams.user } )
            .then(
                function( response ) {
                    if (response.data.Valid === 1) {
                        $rootScope.allowedNewAccount = true;
                        $rootScope.inviteToken = $stateParams.token;
                        $rootScope.preInvited = true;
                        $rootScope.username = $stateParams.user;
                        $state.go('step1');
                    }
                    else {
                        notify({
                            message: 'Invalid Invite Link.',
                            classes: 'notification-danger'
                        });
                        $state.go('login');
                    }
                }
            );
        }
    })

    .state('invite', {
        url: '/invite',
        resolve: {
            direct: function($http, $q, $state, $rootScope, url, User) {
                var deferred = $q.defer();

                if (!$rootScope.preInvited) {
                    User.direct().$promise.then(function(data) {
                        if (data && data.Code === 1000) {
                            if (data.Direct === 1) {
                                $state.go('step1');
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

    .state('step1', {
        url: '/create/new',
        views: {
            'main@': {
                controller: 'SignupController',
                templateUrl: 'templates/layout/auth.tpl.html'
            },
            'panel@step1': {
                templateUrl: 'templates/views/step1.tpl.html'
            }
        },
        resolve: {
            domains: function($q, Domain) {
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
            direct: function($http, $q, $state, $rootScope, url, User) {
                var deferred = $q.defer();

                if (!$rootScope.preInvited) {
                    User.direct().$promise.then(function(data) {
                        if (data && data.Code === 1000) {
                            if (data.Direct === 1) {
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
        resolve: {
            token: function($http, $rootScope, authentication, url, CONFIG) {
                return $http.post(url.get() + '/auth',
                    _.extend(_.pick($rootScope.creds, 'Username', 'Password', 'HashedPassword'), {
                        ClientID: CONFIG.clientID,
                        ClientSecret: CONFIG.clientSecret,
                        GrantType: 'password',
                        State: authentication.randomString(24),
                        RedirectURI: 'https://protonmail.com',
                        ResponseType: 'token',
                        Scope: 'reset'
                    })
                );
            }
        },
        onEnter: function($rootScope, $state, $log) {
            if ($rootScope.TemporaryAccessData===undefined) {
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
                controller: function($scope, $state, $stateParams, pmcw, encryptedToken, networkActivityTracker, notify) {
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
                                    window.sessionStorage['proton:decrypted_token'] = decryptedToken;
                                    window.sessionStorage['proton:encrypted_password'] = pmcw.encode_utf8_base64($scope.params.MessagePassword);
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
            message: function($stateParams, $q, Eo, Message, pmcw) {
                var deferred = $q.defer();
                var token_id = $stateParams.tag;
                var decrypted_token = window.sessionStorage['proton:decrypted_token'];
                var password = pmcw.decode_utf8_base64(window.sessionStorage['proton:encrypted_password']);

                Eo.message(decrypted_token, token_id)
                .then(function(result) {
                    var message = result.data.Message;
                    var promises = [];

                    promises.push(pmcw.decryptMessageRSA(message.Body, password, message.Time).then(function(body) {
                        message.Body = body;
                    }));

                    _.each(message.Replies, function(reply) {
                        promises.push(pmcw.decryptMessageRSA(reply.Body, password, reply.Time).then(function(body) {
                            reply.Body = body;
                        }));
                    });

                    $q.all(promises).then(function() {
                        message.displayMessage = true;
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
            message: function($stateParams, $q, Eo, Message, pmcw) {
                var deferred = $q.defer();
                var token_id = $stateParams.tag;
                var decrypted_token = window.sessionStorage['proton:decrypted_token'];
                var password = pmcw.decode_utf8_base64(window.sessionStorage['proton:encrypted_password']);

                Eo.message(decrypted_token, token_id)
                .then(function(result) {
                    var message = result.data.Message;

                    message.publicKey = result.data.PublicKey; // The sender’s public key
                    pmcw.decryptMessageRSA(message.Body, password, message.Time)
                    .then(function(body) {
                        message.Body = '<br /><br /><blockquote>' + body + '</blockquote>';
                        message.Attachments = [];
                        message.NumAttachments = 0;
                        message.replyMessage = true;
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
        onEnter: function($translate) {
            window.onbeforeunload = function() {
                return $translate.instant('MESSAGE_LEAVE_WARNING');
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
            user: function(authentication, $log, $http, pmcw) {
                if(angular.isObject(authentication.user)) {
                    return authentication.user;
                } else {
                    if(angular.isDefined(window.sessionStorage.getItem(CONSTANTS.OAUTH_KEY+':SessionToken'))) {
                        $http.defaults.headers.common['x-pm-session'] = pmcw.decode_base64(window.sessionStorage.getItem(CONSTANTS.OAUTH_KEY+':SessionToken'));
                    }

                    return authentication.fetchUserInfo(); // TODO need to rework this just for the locked page
                }
            }
        },
        onEnter: function($rootScope, authentication, $timeout, CONSTANTS) {
            // This will redirect to a login step if necessary
            delete $rootScope.creds;
            delete $rootScope.tempUser;
            authentication.redirectIfNecessary();
        }
    })

    .state('secured.print', {
        url: '/print/:id',
        onEnter: function($rootScope) {
            $rootScope.isBlank = true;
            $rootScope.printMode = true;
        },
        onExit: function($rootScope) {
            $rootScope.isBlank = false;
            $rootScope.printMode = false;
        },
        views: {
            'main@': {
                controller: 'MessageController',
                templateUrl: 'templates/views/message.print.tpl.html',
            }
        }
    })

    .state('secured.contacts', {
        url: '/contacts',
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

    .state('secured.example', {
        url: '/example',
        views: {
            'content@secured': {
                templateUrl: 'templates/views/example.tpl.html',
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
        resolve: {
            domains: function($q, Domain, networkActivityTracker) {
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

                networkActivityTracker.track(deferred.promise);

                return deferred.promise;
            }
        },
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
            methods: function(Payment, networkActivityTracker) {
                return networkActivityTracker.track(Payment.methods());
            }
        }
    })

    .state('secured.invoice', {
        url: '/invoice/:time',
        onEnter: function($rootScope) {
            $rootScope.isBlank = true;
            $rootScope.printMode = true;
        },
        onExit: function($rootScope) {
            $rootScope.isBlank = false;
            $rootScope.printMode = false;
        },
        resolve: {
            invoice: function(user, $stateParams, $q, Payment) {
                var deferred = $q.defer();
                var time = $stateParams.time;
                var limit = 1;

                Payment.organization(time, limit).then(function(result) {
                    if(angular.isDefined(result.data) && result.data.Code === 1000) {
                        deferred.resolve(_.first(result.data.Payments));
                    } else {
                        deferred.reject();
                    }
                }, function() {
                    deferred.reject();
                });

                return deferred.promise;
            }
        },
        views: {
            'main@': {
                templateUrl: 'templates/views/invoice.print.tpl.html',
                controller: function($scope, invoice, $timeout, user, Organization) {
                    $scope.invoice = invoice;
                    $scope.user = user;

                    Organization.get(invoice.OrganizationID).then(
                        function(result) {
                            if (result.data && result.data.Code===1000) {
                                $scope.organization = result.data.Organization;
                                $timeout( function() {
                                    window.print();
                                }, 200);
                            }
                        },
                        function(result) {

                        }
                    );
                },
            }
        }
    })

    .state('secured.invoices', {
        url: '/invoices',
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
                templateUrl: 'templates/views/invoices.tpl.html',
                controller: 'InvoicesController'
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
            organization: function(user, Organization, networkActivityTracker, CONSTANTS) {
                return networkActivityTracker.track(Organization.get());
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
            organization: function(user, Organization, networkActivityTracker) {
                if(user.Role === 2) {
                    return networkActivityTracker.track(Organization.get());
                } else {
                    return true;
                }
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
            access: function(user, $q) {
                var deferred = $q.defer();

                if(user.Role === 2) {
                    deferred.resolve();
                } else {
                    deferred.reject();
                }

                return deferred.promise;
            },
            organization: function(user, Organization, networkActivityTracker) {
                if(user.Role === 2) {
                    return networkActivityTracker.track(Organization.get());
                } else {
                    return true;
                }
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
                templateUrl: 'templates/views/domains.tpl.html',
                controller: 'DomainsController'
            }
        }
    })

    .state('secured.themeReset', {
        url: '/theme-reset',
        views: {
            'content@secured': {
                templateUrl: 'templates/views/theme-reset.tpl.html',
                controller: 'SettingsController'
            }
        },
        onEnter: function(Setting, user, $state) {
            Setting.theme({
              'Theme': ''
            }).$promise.then(
                function(response) {
                    user.Theme = '';
                    $state.go('secured.inbox');
                    return;
                },
                function(response) {
                    $state.go('secured.inbox');
                    return;
                }
            );
        }

    });

    _.each(CONSTANTS.MAILBOX_IDENTIFIERS, function(id, box) {
        var parentState = 'secured.' + box;
        var childState = 'secured.' + box + '.view';
        var view = {};
        var list = {};

        list['content@secured'] = {
            controller: 'ConversationsController',
            templateUrl: 'templates/partials/conversations.tpl.html'
        };

        view['view@secured.' + box] = {
            templateUrl: 'templates/partials/conversation.tpl.html',
            controller: 'ConversationController',
            resolve: {
                conversation: function($stateParams, cache, networkActivityTracker) {
                    return networkActivityTracker.track(cache.getConversation($stateParams.id));
                }
            }
        };

        $stateProvider.state(parentState, {
            url: '/' + box + '?' + conversationParameters(),
            views: list,
            onExit: function($rootScope) {
                $rootScope.showWelcome = false;
            }
        });

        $stateProvider.state(childState, {
            url: '/{id}',
            views: view,
            onExit: function($rootScope) {
                $rootScope.$broadcast('unactiveMessages');
            }
        });
    });

    $urlRouterProvider.otherwise(function($injector) {
        var $state = $injector.get('$state');
        var stateName = $injector.get('authentication').state() || 'secured.inbox';

        return $state.href(stateName);
    });

    $locationProvider.html5Mode(true);
})

.run(function($rootScope, $state, $stateParams) {
    $rootScope.go = _.bind($state.go, $state);

    $rootScope.idDefined = function() {
        var id = $stateParams.id;

        return angular.isDefined(id) && id.length > 0;
    };

    $rootScope.deselectAll = function() {
        $rootScope.$broadcast('unselectAllElements');
    };
});
