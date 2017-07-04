angular.module('proton.routes', [
    'ui.router',
    'proton.authentication',
    'proton.constants',
    'proton.utils'
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
            'wildcard',
            'starred',
            'reload',
            'welcome'
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
        resolve: {
            lang(i18nLoader) {
                return i18nLoader();
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
            domains(pmDomainModel) {
                return pmDomainModel.fetch();
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
        onEnter: ($rootScope, AppModel) => {
            $rootScope.isLoggedIn = true;
            AppModel.set('domoArigato', true);
        }
    })

    .state('pre-invite', {
        url: '/pre-invite/:selector/:token',
        views: {
            'main@': {
                templateUrl: 'templates/layout/pre.tpl.html'
            }
        },
        onEnter($state, $stateParams, $rootScope, notify, Invite, gettextCatalog) {
            const { token, selector } = $stateParams;
            const errorMessage = gettextCatalog.getString('Invalid invite link', null, 'Error');

            $rootScope.loggingOut = false;

            Invite.check(token, selector, CONSTANTS.INVITE_MAIL)
            .then(({ data = {} } = {}) => {
                if (data.Valid === 1) {
                    $rootScope.preInvited = true;
                    $state.go('signup', { inviteToken: $stateParams.token, inviteSelector: $stateParams.selector });
                } else {
                    notify({ message: data.Error || errorMessage, classes: 'notification-danger' });
                    $state.go('login');
                }
            });
        }
    })

    .state('invite', {
        url: '/invite',
        resolve: {
            direct($state, $rootScope, User) {
                if (!$rootScope.preInvited) {
                    return User.direct()
                    .then(({ data = {} } = {}) => {
                        if (data.Direct === 1) {
                            $state.go('signup');
                            return Promise.resolve();
                        }
                        if (data.Code === 1000) {
                            window.location.href = 'https://protonmail.com/invite';
                            return Promise.reject();
                        }
                        $state.go('login');
                        return Promise.reject();
                    });
                }
                return Promise.resolve();
            }
        }
    })

    .state('reset-theme', {
        url: '/reset-theme',
        resolve: {
            lang(i18nLoader) {
                return i18nLoader();
            },
            reset(networkActivityTracker, settingsApi, notify, eventManager, gettextCatalog) {
                const errorMessage = gettextCatalog.getString('Unable to reset theme', null, 'Error');
                const promise = settingsApi.theme({ Theme: '' })
                .then((result = {}) => {
                    const { data } = result;
                    if (data.Code === 1000) {
                        notify({ message: gettextCatalog.getString('Theme reset! Redirecting...', null), classes: 'notification-success' });
                        return eventManager.call();
                    }
                    return Promise.reject(data.Error || errorMessage);
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
            inviteSelector: undefined, // set by invite
            inviteToken: undefined, // set by invite
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
            lang(i18nLoader) {
                return i18nLoader();
            },
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
                            .then(({ data = {} }) => {
                                if (data.Code === 1000) {
                                    deferred.resolve(data.Plans);
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
            domains(direct, pmDomainModel) {
                return pmDomainModel.fetch();
            },
            direct($state, $rootScope, User) {
                if (!$rootScope.preInvited) {
                    return User.direct()
                    .then(({ data = {} } = {}) => {
                        if (data.Direct === 1) {
                            return Promise.resolve(data);
                        }
                        if (data.Code === 1000) {
                            window.location.href = 'https://protonmail.com/invite';
                            return Promise.reject();
                        }
                        $state.go('login');
                        return Promise.reject();
                    });
                }
                return Promise.resolve();
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
        resolve: {
            lang(i18nLoader) {
                return i18nLoader();
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
        },
        resolve: {
            lang(i18nLoader) {
                return i18nLoader();
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

                        const promise = pmcw.decryptMessage(encryptedToken, $scope.params.MessagePassword)
                            .then((decryptedToken) => {
                                secureSessionStorage.setItem('proton:decrypted_token', decryptedToken.data);
                                secureSessionStorage.setItem('proton:encrypted_password', pmcw.encode_utf8_base64($scope.params.MessagePassword));
                                $state.go('eo.message', { tag: $stateParams.tag });
                            })
                            .catch((err) => {
                                console.error(err);
                                notify({ message: 'Wrong Mailbox Password.', classes: 'notification-danger' });
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
            messageData($stateParams, $q, Eo, messageModel, pmcw, secureSessionStorage) {
                const password = pmcw.decode_utf8_base64(secureSessionStorage.getItem('proton:encrypted_password'));

                return Eo.message(secureSessionStorage.getItem('proton:decrypted_token'), $stateParams.tag)
                    .then(({ data = {} }) => {
                        const message = data.Message;
                        const promises = _.reduce(message.Replies, (acc, reply) => {
                            const promise = pmcw.decryptMessageRSA(reply.Body, password, reply.Time)
                                .then(({ data }) => (reply.DecryptedBody = data));
                            acc.push(promise);
                            return acc;
                        }, [
                            pmcw.decryptMessageRSA(message.Body, password, message.Time)
                            .then(({ data } = {}) => (message.DecryptedBody = data))
                        ]);

                        return $q.all(promises).then(() => messageModel(message));
                    });
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
            messageData($stateParams, Eo, messageModel, pmcw, secureSessionStorage) {
                const tokenId = $stateParams.tag;
                const decryptedToken = secureSessionStorage.getItem('proton:decrypted_token');
                const password = pmcw.decode_utf8_base64(secureSessionStorage.getItem('proton:encrypted_password'));

                return Eo.message(decryptedToken, tokenId)
                .then((result) => {
                    const message = result.data.Message;

                    message.publicKey = result.data.PublicKey; // The sender’s public key
                    return pmcw.decryptMessageRSA(message.Body, password, message.Time)
                    .then((body) => {
                        const attachments = _.filter(message.Attachments, (attachment) => { return attachment.Headers && (attachment.Headers['content-id'] || attachment.Headers['content-location']); });

                        message.DecryptedBody = body.data;
                        message.Attachments = attachments;
                        message.NumAttachments = attachments.length;
                        return messageModel(message);
                    });
                });
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
            user(authentication, $http, pmcw, secureSessionStorage, i18nLoader) {
                if (Object.keys(authentication.user).length > 0) {
                    return authentication.user;
                } else if (angular.isDefined(secureSessionStorage.getItem(CONSTANTS.OAUTH_KEY + ':SessionToken'))) {
                    $http.defaults.headers.common['x-pm-session'] = pmcw.decode_base64(secureSessionStorage.getItem(CONSTANTS.OAUTH_KEY + ':SessionToken') || '');
                }

                return authentication.fetchUserInfo()
                    .then((data) => {
                        return i18nLoader(data.Language)
                            .then(() => data);
                    });
            },
            subscription(user, subscriptionModel) {
                return subscriptionModel.fetch();
            },
            organization(user, organizationModel) {
                return organizationModel.fetch();
            }
        },
        onEnter($rootScope, authentication) {
            // This will redirect to a login step if necessary
            authentication.redirectIfNecessary();
        }
    })
    .state('pgp', {
        url: '/pgp/:messageID',
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
                templateUrl: 'templates/views/pgp.tpl.html',
                controller($scope, $rootScope, messageID, downloadFile) {

                    function viewPgp(event) {
                        $scope.$applyAsync(() => {
                            $scope.content = event.data;
                        });
                        window.removeEventListener('message', viewPgp, false);
                    }

                    $scope.download = () => {
                        const blob = new Blob([$scope.content], { type: 'data:text/plain;charset=utf-8;' });
                        const filename = 'pgp.txt';
                        downloadFile(blob, filename);
                    };

                    $scope.print = () => {
                        window.print();
                    };

                    if (window.opener) {
                        const url = window.location.href;
                        const arr = url.split('/');
                        const targetOrigin = arr[0] + '//' + arr[2];
                        window.addEventListener('message', viewPgp, false);
                        window.opener.postMessage(messageID, targetOrigin);
                    }
                }
            }
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
                controller($scope, $rootScope, $sce, messageID) {
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

                            window.removeEventListener('message', printMessage, false);
                            setTimeout(() => window.print(), 2000, false);
                        }
                    }
                }
            }
        }
    })

    .state('secured.contacts', {
        url: '/contacts',
        resolve: {
            delinquent($state, gettextCatalog, user, notify, authentication) {
                if (authentication.user.Delinquent >= 3) {
                    const message = gettextCatalog.getString('Your account currently has an overdue invoice. Please pay all unpaid invoices.', null, 'Info');
                    notify({ message, classes: 'notification-danger' });
                    $state.go('secured.payments');
                }
                return Promise.resolve();
            }
        },
        onEnter(AppModel) {
            AppModel.set('inboxSidebar', true);
        },
        onExit(AppModel) {
            AppModel.set('inboxSidebar', false);
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

    .state('secured.signatures', {
        url: '/signatures',
        resolve: {
            members(user, memberModel, networkActivityTracker) {
                if (user.Role === CONSTANTS.PAID_ADMIN_ROLE) {
                    return networkActivityTracker.track(memberModel.fetch());
                }
                return { data: {} };
            },
            domains(user, domainModel, networkActivityTracker) {
                if (user.Role === CONSTANTS.PAID_ADMIN_ROLE) {
                    return networkActivityTracker.track(domainModel.fetch());
                }
                return { data: {} };
            },
            pmDomains(pmDomainModel, networkActivityTracker) {
                return networkActivityTracker.track(pmDomainModel.fetch());
            },
            organization(user, organizationModel, networkActivityTracker) {
                return networkActivityTracker.track(organizationModel.fetch());
            },
            organizationKeys(user, organizationKeysModel, networkActivityTracker) {
                if (user.Role === CONSTANTS.PAID_ADMIN_ROLE) {
                    return networkActivityTracker.track(organizationKeysModel.fetch());
                }
                return Promise.resolve();
            }
        },
        views: {
            'content@secured': {
                templateUrl: 'templates/views/signatures.tpl.html',
                controller: 'SignaturesController'
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
            access(user, $state) {
                if (user.subuser) {
                    $state.go('secured.account');
                    return Promise.reject();
                }
                return Promise.resolve();
            },
            invoices(Payment, networkActivityTracker) {
                return networkActivityTracker.track(Payment.invoices({ Owner: 0 }));
            },
            organizationInvoices(user, Payment, networkActivityTracker) {
                if (user.Role === CONSTANTS.PAID_ADMIN_ROLE) {
                    return networkActivityTracker.track(Payment.invoices({ Owner: 1 }));
                }
                return {};
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

    .state('secured.vpn', {
        url: '/vpn',
        views: {
            'content@secured': {
                template: '<vpn-view></vpn-view>'
            }
        }
    })

    .state('secured.dashboard', {
        url: '/dashboard',
        params: { scroll: null },
        resolve: {
            access(user, $state) {
                if (user.subuser || user.Role === CONSTANTS.PAID_MEMBER_ROLE) {
                    $state.go('secured.account');
                    return Promise.reject();
                }
                return Promise.resolve();
            },
            dashboardPlans(dashboardModel, subscriptionModel) {
                return subscriptionModel.fetch()
                    .then(({ Currency }) => dashboardModel.loadPlans(Currency));
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
            access(user, $state) {
                if (CONSTANTS.KEY_PHASE > 3 && !user.subuser && user.Role !== CONSTANTS.PAID_MEMBER_ROLE) {
                    return Promise.resolve();
                }
                $state.go('secured.signatures');
                return Promise.reject();
            },
            members(user, memberModel, networkActivityTracker) {
                if (user.Role === CONSTANTS.PAID_ADMIN_ROLE) {
                    return networkActivityTracker.track(memberModel.fetch());
                }
                return { data: {} };
            },
            domains(user, domainModel, networkActivityTracker) {
                if (user.Role === CONSTANTS.PAID_ADMIN_ROLE) {
                    return networkActivityTracker.track(domainModel.fetch());
                }
                return { data: {} };
            },
            pmDomains(pmDomainModel, networkActivityTracker) {
                return networkActivityTracker.track(pmDomainModel.fetch());
            },
            organization(user, organizationModel, networkActivityTracker) {
                return networkActivityTracker.track(organizationModel.fetch());
            },
            organizationKeys(user, organizationKeysModel, networkActivityTracker) {
                if (user.Role === CONSTANTS.PAID_ADMIN_ROLE) {
                    return networkActivityTracker.track(organizationKeysModel.fetch());
                }
                return Promise.resolve();
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
            access(user, $state) {
                if (user.subuser || user.Role === CONSTANTS.PAID_MEMBER_ROLE) {
                    $state.go('secured.signatures');
                    return Promise.reject();
                }
                return Promise.resolve();
            },
            members(user, memberModel, networkActivityTracker) {
                if (user.Role === CONSTANTS.PAID_ADMIN_ROLE) {
                    return networkActivityTracker.track(memberModel.fetch());
                }
                return { data: {} };
            },
            domains(user, domainModel, networkActivityTracker) {
                if (user.Role === CONSTANTS.PAID_ADMIN_ROLE) {
                    return networkActivityTracker.track(domainModel.fetch());
                }
                return { data: {} };
            },
            pmDomains(pmDomainModel, networkActivityTracker) {
                return networkActivityTracker.track(pmDomainModel.fetch());
            },
            organization(user, organizationModel, networkActivityTracker) {
                return networkActivityTracker.track(organizationModel.fetch());
            },
            organizationKeys(user, organizationKeysModel, networkActivityTracker) {
                if (user.Role === CONSTANTS.PAID_ADMIN_ROLE) {
                    return networkActivityTracker.track(organizationKeysModel.fetch());
                }
                return Promise.resolve();
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
                delinquent($state, gettextCatalog, user, notify, authentication) {
                    if (authentication.user.Delinquent >= 3) {
                        const message = gettextCatalog.getString('Your account currently has an overdue invoice. Please pay all unpaid invoices.', null, 'Info');
                        notify({ message, classes: 'notification-danger' });
                        $state.go('secured.payments');
                    }
                    return Promise.resolve();
                }
            },
            onEnter(AppModel) {
                AppModel.set('inboxSidebar', true);
            },
            onExit(AppModel, $rootScope) {
                $rootScope.showWelcome = false;
                AppModel.set('inboxSidebar', false);
            }
        });

        $stateProvider.state(childState, {
            url: '/{id}',
            views: elementView,
            params: { id: null, messageID: null, welcome: null },
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
