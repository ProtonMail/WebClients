angular.module('proton.routes', [
    'ui.router',
    'proton.authentication',
    'proton.constants',
    'proton.storage'
])

.config(($stateProvider, $urlRouterProvider, $locationProvider, CONSTANTS) => {
    const conversationParameters = () => {
        const parameters = [
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
        }
    })

    .state('login.setup', {
        url: '/setup',
        views: {
            'panel@login': {
                controller: 'SetupController',
                templateUrl: 'templates/views/setup.tpl.html'
            }
        },
        resolve: {
            domains($q, Domain) {
                const deferred = $q.defer();

                Domain.available().then((result) => {
                    if (result.data && angular.isArray(result.data.Domains)) {
                        deferred.resolve(result.data.Domains);
                    } else {
                        deferred.reject();
                    }
                }, () => {
                    deferred.reject();
                });

                return deferred.promise;
            },
            user(User) {
                return User.get()
                .then(({ data }) => {
                    if (data && data.Code !== 1000) {
                        return Promise.reject();
                    }
                    return data.User;
                });
            }
        }
    })

    .state('login.sub', {
        url: '/sub',
        views: {
            'panel@login': {
                controller: 'LoginController',
                templateUrl: 'templates/views/unlock.tpl.html'
            }
        },
        onEnter: ($rootScope) => {
            $rootScope.isLoggedIn = true;
            $rootScope.domoArigato = true;
        }
    })

    // -------------------------------------------
    // ACCOUNT ROUTES
    // -------------------------------------------
    .state('account', {
        url: '/account/:username/:token',
        resolve: {
            app($stateParams, $state, $q, User) {
                const defer = $q.defer();

                User.checkInvite({
                    username: $stateParams.username,
                    token: $stateParams.token
                }).$promise.then(() => {
                    defer.resolve();
                }, (response) => {
                    defer.reject(response);
                });

                return defer.promise;
            }
        },
        views: {
            'main@': {
                controller: 'ResetController',
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
                    $state.go('signup');
                } else if (result.data && result.data.Error) {
                    notify({ message: result.data.Error, classes: 'notification-danger' });
                    $state.go('login');
                } else {
                    notify({ message: 'Invalid Invite Link.', classes: 'notification-danger' });
                    $state.go('login');
                }
            });
        }
    })

    .state('invite', {
        url: '/invite',
        resolve: {
            direct($http, $q, $state, $rootScope, url, User) {
                const deferred = $q.defer();

                if (!$rootScope.preInvited) {
                    User.direct()
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            if (result.data.Direct === 1) {
                                $state.go('signup');
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
        url: '/reset-theme',
        resolve: {
            reset(networkActivityTracker, Setting, notify, eventManager, gettextCatalog) {
                const promise = Setting.theme({ Theme: '' })
                .then((result = {}) => {
                    const { data } = result;
                    if (data.Code === 1000) {
                        notify({ message: gettextCatalog.getString('Theme reset! Redirecting...', null), classes: 'notification-success' });
                        return eventManager.call();
                    } else if (data.Error) {
                        return Promise.reject(data.Error);
                    }
                    const errorMessage = gettextCatalog.getString('Unable to reset theme', null, 'Error');
                    return Promise.reject(errorMessage);
                });
                networkActivityTracker.track(promise);
            }
        },
        onEnter($state) {
            $state.go('secured.inbox');
            return;
        }
    })

    .state('signup', {
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
            'panel@signup': {
                templateUrl: 'templates/views/signup.tpl.html'
            }
        },
        resolve: {
            plans(direct, $q, $stateParams, Payment) {
                const deferred = $q.defer();
                const currencies = ['USD', 'EUR', 'CHF'];
                const cycles = ['1', '12'];
                const plans = ['free', 'plus', 'visionary'];
                const currency = $stateParams.currency;
                const cycle = $stateParams.billing;
                const plan = $stateParams.plan;

                if (cycles.indexOf(cycle) !== -1 && currencies.indexOf(currency) !== -1 && plans.indexOf(plan) !== -1) {
                    if (plan === 'free') {
                        deferred.resolve([]);
                    } else {
                        Payment.plans(currency, cycle)
                        .then((result) => {
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
            domains(direct, $q, Domain) {
                const deferred = $q.defer();

                Domain.available().then((result) => {
                    if (result.data && angular.isArray(result.data.Domains)) {
                        deferred.resolve(result.data.Domains);
                    } else {
                        deferred.reject();
                    }
                }, () => {
                    deferred.reject();
                });

                return deferred.promise;
            },
            direct($q, $state, $rootScope, User) {
                const deferred = $q.defer();

                if (!$rootScope.preInvited) {
                    User.direct()
                    .then((result) => {
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
                controller: 'ResetController',
                templateUrl: 'templates/layout/auth.tpl.html'
            },
            'panel@reset': {
                templateUrl: 'templates/views/reset-mailbox-password.tpl.html'
            }
        },
        onEnter($rootScope, $state) {
            if (!$rootScope.isLoggedIn) {
                $state.go('login');
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
        onEnter($state, $stateParams) {
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
        url: '/reset-login-password?username&token',
        params: {
            username: null,
            token: null
        },
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
            encryptedToken(Eo, $stateParams) {
                // Can be null if the network is down
                return Eo.token($stateParams.tag).then(({ data }) => (data || {}).Token);
            }
        },
        views: {
            content: {
                templateUrl: 'templates/views/outside.unlock.tpl.html',
                controller($scope, $state, $stateParams, pmcw, encryptedToken, networkActivityTracker, notify, secureSessionStorage) {
                    $scope.params = {
                        MessagePassword: ''
                    };

                    $scope.tokenError = !encryptedToken;

                    $scope.unlock = () => {

                        const promise = pmcw
                            .decryptMessage(encryptedToken, $scope.params.MessagePassword)
                            .then((decryptedToken) => {
                                secureSessionStorage.setItem('proton:decrypted_token', decryptedToken.data);
                                secureSessionStorage.setItem('proton:encrypted_password', pmcw.encode_utf8_base64($scope.params.MessagePassword));
                                $state.go('eo.message', { tag: $stateParams.tag });
                            }, (err) => {
                                notify({ message: err.message, classes: 'notification-danger' });
                            });

                        networkActivityTracker.track(promise);

                    };
                }
            }
        }
    })

    .state('eo.message', {
        url: '/eo/message/:tag',
        resolve: {
            messageData($stateParams, $q, Eo, Message, pmcw, secureSessionStorage) {
                const deferred = $q.defer();
                const tokenId = $stateParams.tag;
                const decryptedToken = secureSessionStorage.getItem('proton:decrypted_token');
                const password = pmcw.decode_utf8_base64(secureSessionStorage.getItem('proton:encrypted_password'));

                Eo.message(decryptedToken, tokenId)
                .then((result) => {
                    const message = result.data.Message;
                    const promises = [];

                    promises.push(pmcw.decryptMessageRSA(message.Body, password, message.Time).then((body) => {
                        message.DecryptedBody = body.data;
                    }));

                    _.each(message.Replies, (reply) => {
                        promises.push(pmcw.decryptMessageRSA(reply.Body, password, reply.Time).then((body) => {
                            reply.DecryptedBody = body.data;
                        }));
                    });

                    $q.all(promises).then(() => {
                        deferred.resolve(new Message(message));
                    });
                });

                return deferred.promise;
            }
        },
        views: {
            content: {
                controller: 'OutsideController',
                templateUrl: 'templates/views/outside.message.tpl.html'
            }
        }
    })

    .state('eo.reply', {
        url: '/eo/reply/:tag',
        resolve: {
            messageData($stateParams, $q, Eo, Message, pmcw, secureSessionStorage) {
                const deferred = $q.defer();
                const tokenId = $stateParams.tag;
                const decryptedToken = secureSessionStorage.getItem('proton:decrypted_token');
                const password = pmcw.decode_utf8_base64(secureSessionStorage.getItem('proton:encrypted_password'));

                Eo.message(decryptedToken, tokenId)
                .then((result) => {
                    const message = result.data.Message;

                    message.publicKey = result.data.PublicKey; // The sender’s public key
                    pmcw.decryptMessageRSA(message.Body, password, message.Time)
                    .then((body) => {
                        const attachments = _.filter(message.Attachments, (attachment) => { return attachment.Headers && (attachment.Headers['content-id'] || attachment.Headers['content-location']); });

                        message.DecryptedBody = body.data;
                        message.Attachments = attachments;
                        message.NumAttachments = attachments.length;
                        deferred.resolve(new Message(message));
                    });
                });

                return deferred.promise;
            }
        },
        views: {
            content: {
                controller: 'OutsideController',
                templateUrl: 'templates/views/outside.reply.tpl.html'
            }
        },
        onEnter(gettextCatalog) {
            window.onbeforeunload = () => {
                return gettextCatalog.getString('By leaving now, you will lose what you have written in this email. You can save a draft if you want to come back to it later on.', null);
            };
        },
        onExit() {
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
            user(authentication, $http, pmcw, secureSessionStorage) {
                if (Object.keys(authentication.user).length > 0) {
                    return authentication.user;
                } else if (angular.isDefined(secureSessionStorage.getItem(CONSTANTS.OAUTH_KEY + ':SessionToken'))) {
                    $http.defaults.headers.common['x-pm-session'] = pmcw.decode_base64(secureSessionStorage.getItem(CONSTANTS.OAUTH_KEY + ':SessionToken'));
                }

                return authentication.fetchUserInfo(); // TODO need to rework this just for the locked page
            },
            organization($q, user, Organization) {
                const deferred = $q.defer();

                if (user.Role > 0) {
                    Organization.get()
                    .then((result) => {
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
        onEnter($rootScope, authentication) {
            // This will redirect to a login step if necessary
            authentication.redirectIfNecessary();
        }
    })

    .state('printer', {
        params: { messageID: null },
        url: '/printer/:messageID',
        resolve: {
            messageID($stateParams) {
                if ($stateParams.messageID) {
                    return Promise.resolve($stateParams.messageID);
                }
                return Promise.reject();
            }
        },
        views: {
            'main@': {
                templateUrl: 'templates/views/message.print.tpl.html',
                controller($scope, $state, $rootScope, $sce, $timeout, messageID) {
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
            delinquent($q, $state, gettextCatalog, user, notify, authentication) {
                const deferred = $q.defer();

                if (authentication.user.Delinquent < 3) {
                    deferred.resolve();
                } else {
                    notify({ message: gettextCatalog.getString('Your account currently has an overdue invoice. Please pay all unpaid invoices.', null, 'Info'), classes: 'notification-danger' });
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
        resolve: {
            members(user, Member, networkActivityTracker) {
                if (user.Role === 2) {
                    return networkActivityTracker.track(Member.query());
                }
                return { data: {} };
            },
            domains(user, Domain, networkActivityTracker) {
                if (user.Role === 2) {
                    return networkActivityTracker.track(Domain.query());
                }
                return { data: {} };
            },
            organization(user, Organization, networkActivityTracker) {
                if (user.Role === 2) {
                    return networkActivityTracker.track(Organization.get());
                }
                return { data: {} };
            },
            organizationKeys(user, Organization, networkActivityTracker) {
                if (user.Role === 2) {
                    return networkActivityTracker.track(Organization.getKeys());
                }
                return { data: {} };
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
            invoices(Payment, networkActivityTracker) {
                return networkActivityTracker.track(Payment.invoices());
            },
            methods(Payment, networkActivityTracker) {
                return networkActivityTracker.track(Payment.methods());
            }
        }
    })

    .state('secured.keys', {
        url: '/keys',
        views: {
            'content@secured': {
                templateUrl: 'templates/views/keys.tpl.html'
            }
        }
    })

    .state('secured.dashboard', {
        url: '/dashboard',
        params: {
            scroll: null
        },
        resolve: {
            access(user, $q) {
                const deferred = $q.defer();

                if (user.Role === 0 || user.Role === 2) {
                    deferred.resolve();
                } else {
                    deferred.reject();
                }

                return deferred.promise;
            },
            // Return yearly plans
            yearly(user, Payment, networkActivityTracker) {
                return networkActivityTracker.track(Payment.plans(user.Currency, 12));
            },
            // Return monthly plans
            monthly(user, Payment, networkActivityTracker) {
                return networkActivityTracker.track(Payment.plans(user.Currency, 1));
            },
            subscription(user, Payment, networkActivityTracker) {
                return networkActivityTracker.track(Payment.subscription());
            },
            methods(user, Payment, networkActivityTracker) {
                return networkActivityTracker.track(Payment.methods());
            },
            status(user, Payment, networkActivityTracker) {
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
        params: {
            action: null,
            id: null
        },
        resolve: {
            access(user, $q, CONSTANTS) {
                const deferred = $q.defer();

                if (CONSTANTS.KEY_PHASE > 3) {
                    deferred.resolve();
                } else {
                    deferred.reject();
                }

                return deferred.promise;
            },
            members(user, Member, networkActivityTracker) {
                if (user.Role === 2) {
                    return networkActivityTracker.track(Member.query());
                }
                return { data: {} };
            },
            domains(user, Domain, networkActivityTracker) {
                if (user.Role === 2) {
                    return networkActivityTracker.track(Domain.query());
                }
                return { data: {} };
            },
            organization(user, Organization, networkActivityTracker) {
                if (user.Role === 2) {
                    return networkActivityTracker.track(Organization.get());
                }
                return { data: {} };
            },
            organizationKeys(user, Organization, networkActivityTracker) {
                if (user.Role === 2) {
                    return networkActivityTracker.track(Organization.getKeys());
                }
                return { data: {} };
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
            members(user, Member, networkActivityTracker) {
                if (user.Role === 2) {
                    return networkActivityTracker.track(Member.query());
                }
                return { data: {} };
            },
            domains(user, Domain, networkActivityTracker) {
                if (user.Role === 2) {
                    return networkActivityTracker.track(Domain.query());
                }
                return { data: {} };
            },
            organization(user, Organization, networkActivityTracker) {
                if (user.Role === 2) {
                    return networkActivityTracker.track(Organization.get());
                }
                return { data: {} };
            },
            organizationKeys(user, Organization, networkActivityTracker) {
                if (user.Role === 2) {
                    return networkActivityTracker.track(Organization.getKeys());
                }
                return { data: {} };
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
            customFilters($q, Filter, networkActivityTracker) {
                const deferred = $q.defer();

                Filter.query()
                .then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        deferred.resolve(result.data.Filters);
                    } else {
                        deferred.reject();
                    }
                });

                return networkActivityTracker.track(deferred.promise);
            },
            incomingDefaults($q, IncomingDefault, networkActivityTracker) {
                const deferred = $q.defer();

                IncomingDefault.get()
                .then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        deferred.resolve(result.data.IncomingDefaults);
                    } else {
                        deferred.reject();
                    }
                });

                return networkActivityTracker.track(deferred.promise);
            }
        },
        views: {
            'content@secured': {
                templateUrl: 'templates/views/filters.tpl.html',
                controller: 'FiltersController'
            }
        }
    });

    Object.keys(CONSTANTS.MAILBOX_IDENTIFIERS).forEach((box) => {
        const parentState = 'secured.' + box;
        const childState = 'secured.' + box + '.element';
        const elementView = {};
        const list = {};

        list['content@secured'] = {
            controller: 'ElementsController',
            templateUrl: 'templates/partials/conversations.tpl.html'
        };

        elementView['view@secured.' + box] = {
            template: '<element-view></element-view>'
        };

        $stateProvider.state(parentState, {
            url: '/' + box + '?' + conversationParameters(),
            views: list,
            resolve: {
                delinquent($q, $state, gettextCatalog, user, notify, authentication) {
                    const deferred = $q.defer();

                    if (authentication.user.Delinquent < 3) {
                        deferred.resolve();
                    } else {
                        notify({ message: gettextCatalog.getString('Your account currently has an overdue invoice. Please pay all unpaid invoices.', null, 'Info'), classes: 'notification-danger' });
                        $state.go('secured.payments');
                        deferred.reject();
                    }

                    return deferred.promise;
                }
            },
            onExit($rootScope) {
                $rootScope.showWelcome = false;
            }
        });

        $stateProvider.state(childState, {
            url: '/{id}',
            views: elementView,
            params: { id: '', messageID: null },
            onExit($rootScope) {
                $rootScope.$broadcast('unactiveMessages');
                $rootScope.$broadcast('unmarkMessages');
            }
        });
    });

    $urlRouterProvider.otherwise(($injector) => {
        const $state = $injector.get('$state');
        const stateName = $injector.get('authentication').state() || 'secured.inbox';

        return $state.href(stateName);
    });

    $locationProvider.html5Mode(true);
});
