import _ from 'lodash';
import { PAID_ADMIN_ROLE, PAID_MEMBER_ROLE, INVITE_MAIL, INVITE_URL, OAUTH_KEY, MAILBOX_IDENTIFIERS, CURRENCIES, BILLING_CYCLE } from './constants';

export default angular
    .module('proton.routes', ['ui.router', 'proton.authentication', 'proton.constants', 'proton.utils'])

    .config(($stateProvider, $urlRouterProvider, $locationProvider) => {
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
                        templateUrl: require('../templates/layout/login.tpl.html')
                    },
                    'panel@login': {
                        controller: 'LoginController',
                        templateUrl: require('../templates/views/login.tpl.html')
                    }
                },
                resolve: {
                    lang(i18nLoader) {
                        return i18nLoader.translate();
                    }
                }
            })

            .state('login.unlock', {
                url: '/unlock',
                views: {
                    'panel@login': {
                        controller: 'LoginController',
                        templateUrl: require('../templates/views/unlock.tpl.html')
                    }
                }
            })

            .state('login.setup', {
                url: '/setup',
                views: {
                    'panel@login': {
                        controller: 'SetupController',
                        templateUrl: require('../templates/views/setup.tpl.html')
                    }
                },
                resolve: {
                    domains(pmDomainModel) {
                        return pmDomainModel.fetch();
                    },
                    user(User) {
                        return User.get();
                    }
                }
            })

            .state('login.sub', {
                url: '/sub',
                views: {
                    'panel@login': {
                        controller: 'LoginController',
                        templateUrl: require('../templates/views/unlock.tpl.html')
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
                        templateUrl: require('../templates/layout/pre.tpl.html')
                    }
                },
                onEnter($state, $stateParams, $rootScope, notification, Invite, gettextCatalog, AppModel) {
                    const { token: inviteToken, selector: inviteSelector } = $stateParams;
                    const errorMessage = gettextCatalog.getString('Invalid invite link', null, 'Error');

                    $rootScope.loggingOut = false;

                    Invite.check(inviteToken, inviteSelector, INVITE_MAIL)
                        .then(({ data = {} } = {}) => {
                            if (data.Valid === 1) {
                                AppModel.set('preInvited', true);
                                return $state.go('signup', { inviteToken, inviteSelector });
                            }
                            throw new Error(errorMessage);
                        })
                        .catch((err) => {
                            const { data = {} } = err;
                            notification.error(data.Error || errorMessage);
                            $state.go('login');
                        });
                }
            })

            .state('invite', {
                url: '/invite',
                resolve: {
                    direct($state, User, AppModel) {
                        if (!AppModel.is('preInvited')) {
                            return User.direct()
                                .then(({ data = {} } = {}) => {
                                    if (data.Direct === 1) {
                                        $state.go('signup');
                                        return;
                                    }

                                    window.location.href = INVITE_URL;
                                    return Promise.reject();
                                })
                                .catch(() => {
                                    $state.go('login');
                                    return Promise.reject();
                                });
                        }
                        return Promise.resolve();
                    }
                }
            })

            .state('secured.resetTheme', {
                url: '/reset-theme',
                resolve: {
                    reset(user, networkActivityTracker, settingsMailApi, notification, eventManager, gettextCatalog, $state) {
                        const I18N = {
                            SUCCESS: gettextCatalog.getString('Theme reset! Redirecting...', null, 'Info'),
                            ERROR: gettextCatalog.getString('Unable to reset theme', null, 'Error')
                        };
                        const promise = settingsMailApi
                            .updateTheme({ Theme: '' })
                            .then(() => notification.success(I18N.SUCCESS))
                            .catch(() => {
                                throw new Error(I18N.ERROR);
                            })
                            .then(eventManager.call)
                            .then(() => $state.go('secured.inbox'));
                        networkActivityTracker.track(promise);
                    }
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
                        templateUrl: require('../templates/layout/auth.tpl.html')
                    },
                    'panel@signup': {
                        templateUrl: require('../templates/views/signup.tpl.html')
                    }
                },
                resolve: {
                    lang(i18nLoader) {
                        return i18nLoader.translate();
                    },
                    plans($stateParams, Payment) {
                        const { currency, billing: cycle, plan } = $stateParams;
                        const isValidCurrency = _.includes(CURRENCIES, currency);
                        const isValidCycle = _.includes(BILLING_CYCLE, +cycle);
                        const isValidPlan = _.includes(['free', 'plus', 'visionary', 'professional'], plan);

                        if (isValidCycle && isValidCurrency && isValidPlan) {
                            if (plan === 'free') {
                                return Promise.resolve([]);
                            }

                            return Payment.plans(currency, cycle).then(({ data }) => data.Plans);
                        }

                        return Promise.resolve([]);
                    },
                    optionsHumanCheck(signupModel) {
                        return signupModel.getOptionsVerification();
                    },
                    domains(pmDomainModel) {
                        return pmDomainModel.fetch();
                    }
                }
            })

            // -------------------------------------------
            // SUPPORT ROUTES
            // -------------------------------------------
            .state('support', {
                abstract: true,
                url: '/help',
                views: {
                    'main@': {
                        controller: 'SupportController',
                        templateUrl: require('../templates/layout/auth.tpl.html')
                    }
                }
            })

            // Generic Message View Template
            .state('support.message', {
                url: '/message',
                onEnter($state, $stateParams) {
                    if ($stateParams.data === null) {
                        $state.go('login');
                    }
                },
                views: {
                    'panel@support': {
                        templateUrl: require('../templates/views/support-message.tpl.html')
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
                        templateUrl: require('../templates/views/reset-login-password.tpl.html')
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
                        templateUrl: require('../templates/layout/outside.tpl.html')
                    }
                },
                resolve: {
                    lang(i18nLoader) {
                        return i18nLoader.translate();
                    }
                }
            })

            .state('eo.unlock', {
                url: '/eo/:tag',
                resolve: {
                    encryptedToken(Eo, $stateParams) {
                        // Can be null if the network is down
                        return Eo.token($stateParams.tag)
                            .then(({ data = {} } = {}) => data.Token)
                            .catch(() => {
                                return Promise.resolve(false);
                            });
                    }
                },
                views: {
                    content: {
                        templateUrl: require('../templates/views/outside.unlock.tpl.html'),
                        controller($scope, $state, $stateParams, pmcw, encryptedToken, networkActivityTracker, notification, secureSessionStorage) {
                            $scope.params = {
                                MessagePassword: ''
                            };

                            $scope.tokenError = !encryptedToken;

                            $scope.unlock = () => {
                                const message = pmcw.getMessage(encryptedToken);
                                const promise = pmcw
                                    .decryptMessage({ message, passwords: [ $scope.params.MessagePassword ] })
                                    .then((decryptedToken) => {
                                        secureSessionStorage.setItem('proton:decrypted_token', decryptedToken.data);
                                        secureSessionStorage.setItem(
                                            'proton:encrypted_password',
                                            pmcw.encode_utf8_base64($scope.params.MessagePassword)
                                        );
                                        $state.go('eo.message', { tag: $stateParams.tag });
                                    })
                                    .catch((err) => {
                                        console.error(err);
                                        notification.error('Wrong Mailbox Password.');
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
                    app(lazyLoader, i18nLoader) {
                        return lazyLoader.app().then(i18nLoader.localizeDate);
                    },
                    messageData(app, $stateParams, $q, Eo, messageModel, pmcw, secureSessionStorage) {
                        const password = pmcw.decode_utf8_base64(secureSessionStorage.getItem('proton:encrypted_password'));

                        return Eo.message(secureSessionStorage.getItem('proton:decrypted_token'), $stateParams.tag).then(({ data = {} }) => {
                            const message = data.Message;
                            const promises = _.reduce(
                                message.Replies,
                                (acc, reply) => {
                                    const promise = pmcw
                                        .decryptMessage({
                                            message: pmcw.getMessage(reply.Body),
                                            passwords: [ password ]
                                        })
                                        .then(({ data }) => (reply.DecryptedBody = data));
                                    acc.push(promise);
                                    return acc;
                                },
                                [
                                    pmcw
                                        .decryptMessage({
                                            message: pmcw.getMessage(message.Body),
                                            passwords: [ password ]
                                        })
                                        .then(({ data } = {}) => (message.DecryptedBody = data))
                                ]
                            );

                            return $q.all(promises).then(() => messageModel(message));
                        });
                    }
                },
                views: {
                    content: {
                        controller: 'OutsideController',
                        templateUrl: require('../templates/views/outside.message.tpl.html')
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

                        return Eo.message(decryptedToken, tokenId).then((result) => {
                            const message = result.data.Message;

                            message.publicKey = result.data.PublicKey; // The sender’s public key
                            return pmcw
                                .decryptMessage({
                                    message: pmcw.getMessage(message.Body),
                                    passwords: [ password ]
                                })
                                .then((body) => {
                                    const attachments = _.filter(message.Attachments, (attachment) => {
                                        return attachment.Headers && (attachment.Headers['content-id'] || attachment.Headers['content-location']);
                                    });

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
                        templateUrl: require('../templates/views/outside.reply.tpl.html')
                    }
                },
                onEnter(gettextCatalog) {
                    window.onbeforeunload = () => {
                        return gettextCatalog.getString(
                            'By leaving now, you will lose what you have written in this email. You can save a draft if you want to come back to it later on.',
                            null
                        );
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
                        templateUrl: require('../templates/layout/secured.tpl.html')
                    },
                    'sidebar@secured': {
                        controller: 'SidebarController',
                        templateUrl: require('../templates/layout/sidebar.tpl.html')
                    }
                },
                resolve: {
                    app(lazyLoader) {
                        // We need to lazy load the app before being able to build the user object.
                        return lazyLoader.app();
                    },
                    // Contains also labels and contacts
                    user(app, authentication, $http, pmcw, secureSessionStorage, i18nLoader, userSettingsModel) {
                        const isAuth = Object.keys(authentication.user || {}).length > 0;
                        if (isAuth) {
                            return i18nLoader.localizeDate().then(() => authentication.user);
                        }

                        const uid = secureSessionStorage.getItem(OAUTH_KEY + ':UID');

                        if (uid) {
                            $http.defaults.headers.common['x-pm-uid'] = uid;
                        } else if (angular.isDefined(secureSessionStorage.getItem(OAUTH_KEY + ':SessionToken'))) {
                            $http.defaults.headers.common['x-pm-uid'] = pmcw.decode_base64(
                                secureSessionStorage.getItem(OAUTH_KEY + ':SessionToken') || ''
                            );
                            secureSessionStorage.setItem(OAUTH_KEY + ':UID', $http.defaults.headers.common['x-pm-uid']);
                            secureSessionStorage.removeItem(OAUTH_KEY + ':SessionToken');
                        }

                        return authentication.fetchUserInfo().then((data) => {
                            return i18nLoader
                                .translate(userSettingsModel.get('Locale'))
                                .then(i18nLoader.localizeDate)
                                .then(() => data);
                        });
                    },
                    labels(user, Label, labelsModel, networkActivityTracker) {
                        const promise = Label.query().then(({ data = {} } = {}) => {
                            labelsModel.set(data.Labels);
                        });

                        networkActivityTracker.track(promise);
                        return promise;
                    },
                    subscription(user, subscriptionModel) {
                        return subscriptionModel.fetch();
                    },
                    organization(user, organizationModel) {
                        return organizationModel.fetch();
                    },
                    premiums(user, premiumDomainModel) {
                        return premiumDomainModel.fetch();
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
                    app(lazyLoader) {
                        // We need to lazy load the app.
                        return lazyLoader.app();
                    },
                    messageID(app, $stateParams) {
                        if ($stateParams.messageID) {
                            return $stateParams.messageID;
                        }
                        return Promise.reject();
                    }
                },
                views: {
                    'main@': {
                        templateUrl: require('../templates/views/pgp.tpl.html'),
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
                    app(lazyLoader) {
                        // We need to lazy load the app before being able to build the user object.
                        return lazyLoader.app();
                    },
                    messageID(app, $stateParams) {
                        if ($stateParams.messageID) {
                            return $stateParams.messageID;
                        }
                        return Promise.reject();
                    }
                },
                views: {
                    'main@': {
                        templateUrl: require('../templates/views/message.print.tpl.html'),
                        controller($scope, $rootScope, $sce, messageID) {
                            $scope.loading = true;

                            if (window.opener) {
                                const [protocol, , host] = window.location.href.split('/');
                                const targetOrigin = `${protocol}//${host}`;

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

            .state('secured.account', {
                url: '/account',
                views: {
                    'content@secured': {
                        templateUrl: require('../templates/views/account.tpl.html'),
                        controller: 'AccountController'
                    }
                },
                resolve: {
                    methods(user, paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getMethods(null, user));
                    },
                    status(user, paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getStatus());
                    }
                },
                onEnter(AppModel) {
                    AppModel.set('inboxSidebar', false);
                    AppModel.set('contactSidebar', false);
                    AppModel.set('settingsSidebar', true);
                }
            })

            .state('secured.labels', {
                url: '/labels',
                views: {
                    'content@secured': {
                        templateUrl: require('../templates/views/labels.tpl.html'),
                        controller: 'LabelsController'
                    }
                },
                resolve: {
                    methods(user, paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getMethods(null, user));
                    },
                    status(user, paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getStatus());
                    }
                },
                onEnter(AppModel) {
                    AppModel.set('inboxSidebar', false);
                    AppModel.set('contactSidebar', false);
                    AppModel.set('settingsSidebar', true);
                }
            })

            .state('secured.security', {
                url: '/security',
                views: {
                    'content@secured': {
                        templateUrl: require('../templates/views/security.tpl.html'),
                        controller: 'SecurityController'
                    }
                },
                resolve: {
                    methods(user, paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getMethods(null, user));
                    },
                    status(user, paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getStatus());
                    }
                },
                onEnter(AppModel) {
                    AppModel.set('inboxSidebar', false);
                    AppModel.set('contactSidebar', false);
                    AppModel.set('settingsSidebar', true);
                }
            })

            .state('secured.appearance', {
                url: '/appearance',
                views: {
                    'content@secured': {
                        templateUrl: require('../templates/views/appearance.tpl.html'),
                        controller: 'AppearanceController'
                    }
                },
                resolve: {
                    methods(user, paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getMethods(null, user));
                    },
                    status(user, paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getStatus());
                    }
                },
                onEnter(AppModel) {
                    AppModel.set('inboxSidebar', false);
                    AppModel.set('contactSidebar', false);
                    AppModel.set('settingsSidebar', true);
                }
            })

            .state('secured.payments', {
                url: '/payments',
                views: {
                    'content@secured': {
                        templateUrl: require('../templates/views/payments.tpl.html'),
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
                        if (user.Role === PAID_ADMIN_ROLE) {
                            return networkActivityTracker.track(Payment.invoices({ Owner: 1 }));
                        }
                        return {};
                    },
                    methods(user, paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getMethods(null, user));
                    },
                    status(paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getStatus());
                    }
                },
                onEnter(AppModel) {
                    AppModel.set('inboxSidebar', false);
                    AppModel.set('contactSidebar', false);
                    AppModel.set('settingsSidebar', true);
                }
            })

            .state('secured.keys', {
                url: '/keys',
                views: {
                    'content@secured': {
                        template: '<keys-view></keys-view>'
                    }
                },
                resolve: {
                    methods(user, paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getMethods(null, user));
                    },
                    status(user, paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getStatus());
                    }
                },
                onEnter(AppModel) {
                    AppModel.set('inboxSidebar', false);
                    AppModel.set('contactSidebar', false);
                    AppModel.set('settingsSidebar', true);
                }
            })

            .state('secured.vpn', {
                url: '/vpn',
                views: {
                    'content@secured': {
                        template: '<vpn-view></vpn-view>'
                    }
                },
                resolve: {
                    methods(user, paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getMethods(null, user));
                    },
                    status(user, paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getStatus());
                    },
                    vpn(user, vpnModel, networkActivityTracker) {
                        return networkActivityTracker.track(vpnModel.fetch());
                    }
                },
                onEnter(AppModel) {
                    AppModel.set('inboxSidebar', false);
                    AppModel.set('contactSidebar', false);
                    AppModel.set('settingsSidebar', true);
                }
            })

            .state('secured.dashboard', {
                url: '/dashboard',
                params: { scroll: null, noBlackFridayModal: null, cycle: null, currency: null },
                resolve: {
                    access(user, $state) {
                        if (user.subuser || user.Role === PAID_MEMBER_ROLE) {
                            $state.go('secured.account');
                            return Promise.reject();
                        }
                        return Promise.resolve();
                    },
                    dashboardPlans(user, dashboardModel, subscriptionModel) {
                        return subscriptionModel.fetch().then(({ Currency }) => dashboardModel.loadPlans(Currency));
                    },
                    methods(user, paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getMethods(null, user));
                    },
                    status(user, paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getStatus());
                    }
                },
                views: {
                    'content@secured': {
                        templateUrl: require('../templates/views/dashboard.tpl.html'),
                        controller: 'DashboardController'
                    }
                },
                onEnter(AppModel) {
                    AppModel.set('inboxSidebar', false);
                    AppModel.set('contactSidebar', false);
                    AppModel.set('settingsSidebar', true);
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
                        if (!user.subuser && user.Role !== PAID_MEMBER_ROLE) {
                            return Promise.resolve();
                        }
                        $state.go('secured.account');
                        return Promise.reject();
                    },
                    members(user, memberModel, networkActivityTracker) {
                        if (user.Role === PAID_ADMIN_ROLE) {
                            return networkActivityTracker.track(memberModel.fetch());
                        }
                        return { data: {} };
                    },
                    domains(user, domainModel, networkActivityTracker) {
                        if (user.Role === PAID_ADMIN_ROLE) {
                            return networkActivityTracker.track(domainModel.fetch());
                        }
                        return { data: {} };
                    },
                    pmDomains(user, pmDomainModel, networkActivityTracker) {
                        return networkActivityTracker.track(pmDomainModel.fetch());
                    },
                    organization(user, organizationModel, networkActivityTracker) {
                        return networkActivityTracker.track(organizationModel.fetch());
                    },
                    organizationKeys(user, organizationKeysModel, networkActivityTracker) {
                        if (user.Role === PAID_ADMIN_ROLE) {
                            return networkActivityTracker.track(organizationKeysModel.fetch());
                        }
                        return Promise.resolve();
                    },
                    methods(user, paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getMethods(null, user));
                    },
                    status(user, paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getStatus());
                    }
                },
                views: {
                    'content@secured': {
                        templateUrl: require('../templates/views/members.tpl.html'),
                        controller: 'MembersController'
                    }
                },
                onEnter(AppModel) {
                    AppModel.set('inboxSidebar', false);
                    AppModel.set('contactSidebar', false);
                    AppModel.set('settingsSidebar', true);
                }
            })

            .state('secured.domains', {
                url: '/domains',
                resolve: {
                    access(user, $state) {
                        if (user.subuser || user.Role === PAID_MEMBER_ROLE) {
                            $state.go('secured.account');
                            return Promise.reject();
                        }
                        return Promise.resolve();
                    },
                    members(user, memberModel, networkActivityTracker) {
                        if (user.Role === PAID_ADMIN_ROLE) {
                            return networkActivityTracker.track(memberModel.fetch());
                        }
                        return { data: {} };
                    },
                    domains(user, domainModel, networkActivityTracker) {
                        if (user.Role === PAID_ADMIN_ROLE) {
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
                        if (user.Role === PAID_ADMIN_ROLE) {
                            return networkActivityTracker.track(organizationKeysModel.fetch());
                        }
                        return Promise.resolve();
                    },
                    methods(user, paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getMethods(null, user));
                    },
                    status(user, paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getStatus());
                    }
                },
                views: {
                    'content@secured': {
                        templateUrl: require('../templates/views/domains.tpl.html'),
                        controller: 'DomainsController'
                    }
                },
                onEnter(AppModel) {
                    AppModel.set('inboxSidebar', false);
                    AppModel.set('contactSidebar', false);
                    AppModel.set('settingsSidebar', true);
                }
            })

            .state('secured.bridge', {
                url: '/bridge',
                views: {
                    'content@secured': {
                        template: '<bridge-view></bridge-view>'
                    }
                },
                onEnter(AppModel) {
                    AppModel.set('inboxSidebar', false);
                    AppModel.set('contactSidebar', false);
                    AppModel.set('settingsSidebar', true);
                }
            })

            .state('secured.pmme', {
                url: '/pmme',
                views: {
                    'content@secured': {
                        template: '<pm-me-view></pm-me-view>'
                    }
                },
                onEnter(AppModel) {
                    AppModel.set('inboxSidebar', false);
                    AppModel.set('contactSidebar', false);
                    AppModel.set('settingsSidebar', true);
                }
            })

            .state('secured.filters', {
                url: '/filters',
                resolve: {
                    vendor(app, lazyLoader) {
                        return lazyLoader.extraVendor();
                    },
                    loadSpamLists(vendor, user, spamListModel, networkActivityTracker) {
                        return networkActivityTracker.track(spamListModel.load());
                    },
                    methods(user, paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getMethods(null, user));
                    },
                    status(user, paymentModel, networkActivityTracker) {
                        return networkActivityTracker.track(paymentModel.getStatus());
                    }
                },
                views: {
                    'content@secured': {
                        template: '<filter-view></filter-view>'
                    }
                },
                onEnter(AppModel) {
                    AppModel.set('inboxSidebar', false);
                    AppModel.set('contactSidebar', false);
                    AppModel.set('settingsSidebar', true);
                }
            })
            .state('secured.autoresponder', {
                url: '/autoresponder',
                views: {
                    'content@secured': {
                        template: '<autoresponder-view></autoresponder-view>'
                    }
                },
                onEnter(AppModel) {
                    AppModel.set('settingsSidebar', true);
                },
                onExit(AppModel) {
                    AppModel.set('settingsSidebar', false);
                }
            });

        $stateProvider
            .state('secured.contacts', {
                url: '/contacts?sort&page&keyword',
                params: {
                    page: { value: null, squash: true },
                    keyword: { value: null, squash: true },
                    sort: { value: null, squash: true }
                },
                resolve: {
                    delinquent(user, isDelinquent) {
                        return isDelinquent();
                    }
                },
                views: {
                    'content@secured': {
                        template: '<contact-view></contact-view>'
                    }
                },
                onEnter(AppModel) {
                    AppModel.set('inboxSidebar', false);
                    AppModel.set('contactSidebar', true);
                    AppModel.set('settingsSidebar', false);
                }
            })
            .state('secured.contacts.details', {
                url: '/:id',
                params: { id: null },
                views: {
                    'details@secured.contacts': {
                        template: '<contact-right-panel></contact-right-panel>'
                    }
                }
            });

        Object.keys(MAILBOX_IDENTIFIERS).forEach((box) => {
            const parentState = 'secured.' + box;
            const childState = 'secured.' + box + '.element';

            const url = `/${box}?${conversationParameters()}`;
            const views = {
                'content@secured': {
                    controller: 'ElementsController',
                    templateUrl: require('../templates/partials/conversations.tpl.html')
                }
            };

            $stateProvider.state(parentState, {
                url,
                views,
                resolve: {
                    delinquent(user, isDelinquent) {
                        return isDelinquent();
                    }
                },
                onEnter(AppModel) {
                    AppModel.set('inboxSidebar', true);
                    AppModel.set('contactSidebar', false);
                    AppModel.set('settingsSidebar', false);
                },
                onExit(AppModel, $rootScope) {
                    $rootScope.showWelcome = false;
                }
            });

            const elementView = {
                [`view@secured.${box}`]: {
                    template: '<element-view></element-view>'
                }
            };

            $stateProvider.state(childState, {
                url: '/{id}',
                views: elementView,
                params: { id: null, messageID: null, welcome: null },
                onExit($rootScope) {
                    $rootScope.$emit('unmarkMessages');
                }
            });
        });

        $urlRouterProvider.otherwise(($injector) => {
            const $state = $injector.get('$state');
            const stateName = $injector.get('authentication').state() || 'secured.inbox';

            return $state.href(stateName);
        });

        $locationProvider.html5Mode(true);
    }).name;
