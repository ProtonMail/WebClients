import _ from 'lodash';

import {
    PAID_ADMIN_ROLE,
    PAID_MEMBER_ROLE,
    PRODUCT_TYPE,
    INVITE_URL,
    MAILBOX_IDENTIFIERS,
    CURRENCIES,
    DEFAULT_CURRENCY,
    DEFAULT_CYCLE,
    BILLING_CYCLE,
    SIGNUP_PLANS
} from './constants';
import { decrypt } from '../helpers/message';
import { isIE11 } from '../helpers/browser';

export default angular
    .module('proton.routes', ['ui.router', 'proton.authentication', 'proton.utils'])

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
                onEnter(dropIE11ModalModal) {
                    if (isIE11()) {
                        dropIE11ModalModal.activate();
                    }
                },
                views: {
                    'main@': {
                        templateUrl: require('../templates/layout/login.tpl.html')
                    },
                    'panel@login': {
                        template: '<login-container></login-container>'
                    }
                },
                resolve: {
                    lang(i18nLoader) {
                        return i18nLoader.translate();
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
                    },
                    addresses(Address) {
                        return Address.query();
                    },
                    vpn(user, vpnSettingsModel) {
                        return vpnSettingsModel.fetch();
                    }
                }
            })

            .state('login.down', {
                views: {
                    'panel@login': {
                        template: '<account-load-error></account-load-error>'
                    }
                }
            })

            .state('login.sub', {
                url: '/sub',
                views: {
                    'panel@login': {
                        template: '<login-sub-container></login-sub-container>'
                    }
                }
            })

            .state('pre-invite', {
                url: '/pre-invite/:selector/:token',
                views: {
                    'main@': {
                        templateUrl: require('../templates/layout/pre.tpl.html')
                    }
                },
                onEnter($state, $stateParams, notification, Invite, gettextCatalog, AppModel) {
                    const { token: inviteToken, selector: inviteSelector } = $stateParams;
                    const errorMessage = gettextCatalog.getString('Invalid invite link', null, 'Error');

                    AppModel.set('loggingOut', false);

                    Invite.check(inviteToken, inviteSelector, PRODUCT_TYPE.MAIL)
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
                                .catch((e) => {
                                    $state.go('login');
                                    throw e;
                                });
                        }
                    }
                }
            })

            .state('secured.resetTheme', {
                url: '/reset-theme',
                resolve: {
                    reset(
                        user,
                        networkActivityTracker,
                        settingsMailApi,
                        notification,
                        eventManager,
                        gettextCatalog,
                        $state
                    ) {
                        const I18N = {
                            SUCCESS: gettextCatalog.getString('Theme reset! Redirecting...', null, 'Info')
                        };
                        const promise = settingsMailApi
                            .updateTheme({ Theme: '' })
                            .then(() => notification.success(I18N.SUCCESS))
                            .then(eventManager.call)
                            .then(() => $state.go('secured.inbox'));
                        networkActivityTracker.track(promise);
                    }
                }
            })

            .state('signup', {
                url: '/create/new?plan&billing&currency&coupon',
                params: {
                    inviteSelector: undefined, // set by invite
                    inviteToken: undefined, // set by invite
                    plan: null, // 'free' / 'plus' / 'visionary' / 'plus_vpnplus'
                    billing: `${DEFAULT_CYCLE}`, // 1 / 12
                    currency: DEFAULT_CURRENCY, // 'CHF' / 'EUR' / 'USD'
                    coupon: null
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
                    subscriptionInfo($stateParams) {
                        const { currency, billing, plan, coupon } = $stateParams;
                        const cycle = +billing;

                        const isValidCurrency = _.includes(CURRENCIES, currency);
                        const isValidCycle = _.includes(BILLING_CYCLE, cycle);
                        const isValidPlan = _.includes(SIGNUP_PLANS, plan);

                        if (!isValidCurrency || !isValidPlan || !isValidCycle) {
                            return;
                        }

                        return { planNames: plan.split('_'), currency, cycle, coupon };
                    },
                    optionsHumanCheck(signupModel) {
                        return signupModel.getOptionsVerification();
                    },
                    domains(pmDomainModel) {
                        return pmDomainModel.fetch({ params: { Type: 'signup' } });
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
                },
                resolve: {
                    i18n(i18nLoader) {
                        return i18nLoader.translate();
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
                    app(lazyLoader, i18nLoader) {
                        return lazyLoader
                            .app()
                            .then(i18nLoader.translate)
                            .then(i18nLoader.localizeDate);
                    }
                }
            })

            .state('eo.unlock', {
                url: '/eo/:tag',
                resolve: {
                    encryptedToken(app, Eo, $stateParams) {
                        // Can be null if the network is down
                        return Eo.token($stateParams.tag)
                            .then(({ data = {} } = {}) => data.Token)
                            .catch(() => {
                                return false;
                            });
                    }
                },
                views: {
                    content: {
                        templateUrl: require('../templates/views/outside.unlock.tpl.html'),
                        controller: 'OutsideUnlockController'
                    }
                }
            })

            .state('eo.message', {
                url: '/eo/message/:tag',
                resolve: {
                    messageData(app, $state, $stateParams, $q, Eo, messageModel, eoStore) {
                        const tokenId = $stateParams.tag;

                        const decryptedToken = eoStore.getToken();
                        const password = eoStore.getPassword();

                        // Can happen when a user goes directly to this URL.
                        if (!decryptedToken) {
                            $state.go('eo.unlock', { tag: tokenId });
                            return Promise.reject();
                        }

                        return Eo.message(decryptedToken, tokenId).then(({ data = {} }) => {
                            const message = data.Message;
                            const promises = _.reduce(
                                message.Replies,
                                (acc, reply) => {
                                    const promise = decrypt(reply, password).then(
                                        (body) => (reply.DecryptedBody = body)
                                    );
                                    acc.push(promise);
                                    return acc;
                                },
                                [decrypt(message, password).then((body) => (message.DecryptedBody = body))]
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
                    messageData(app, $state, $stateParams, Eo, messageModel, eoStore) {
                        const tokenId = $stateParams.tag;

                        const decryptedToken = eoStore.getToken();
                        const password = eoStore.getPassword();

                        // Can happen when a user goes directly to this URL.
                        if (!decryptedToken) {
                            $state.go('eo.unlock', { tag: tokenId });
                            return Promise.reject();
                        }

                        return Eo.message(decryptedToken, tokenId).then((result) => {
                            const message = result.data.Message;

                            message.publicKey = result.data.PublicKey; // The sender’s public key

                            return decrypt(message, password).then((body) => {
                                const attachments = _.filter(message.Attachments, (attachment) => {
                                    return (
                                        attachment.Headers &&
                                        (attachment.Headers['content-id'] || attachment.Headers['content-location'])
                                    );
                                });

                                message.DecryptedBody = body;
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
                            null,
                            'Info'
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
                    user(app, authentication, $http, i18nLoader, userSettingsModel) {
                        const isAuth = Object.keys(authentication.user || {}).length > 0;
                        if (isAuth) {
                            i18nLoader.localizeDate();
                            return authentication.user;
                        }

                        return authentication.fetchUserInfo().then((data) => {
                            return i18nLoader
                                .translate(userSettingsModel.get('Locale'))
                                .then(i18nLoader.localizeDate)
                                .then(() => data);
                        });
                    },
                    labels(user, labelsModel, networkActivityTracker) {
                        const promise = labelsModel.load();
                        networkActivityTracker.track(promise);
                        return promise;
                    },
                    contactGroups(user, contactGroupModel, networkActivityTracker) {
                        const promise = contactGroupModel.load();
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
                onEnter(AppModel, $state, authentication) {
                    if (!authentication.isLoggedIn()) {
                        return $state.go('login');
                    }
                    AppModel.set('isLoggedIn', true);
                    AppModel.set('isSecure', true);
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
                    members(user, memberModel, networkActivityTracker) {
                        if (user.Role === PAID_ADMIN_ROLE) {
                            const promise = memberModel.fetch();
                            networkActivityTracker.track(promise);
                            return promise;
                        }
                    },
                    sessions(members, activeSessionsModel, networkActivityTracker) {
                        const promise = activeSessionsModel.fetch();
                        networkActivityTracker.track(promise);
                        return promise;
                    },
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
                    vpn(user, vpnSettingsModel, networkActivityTracker) {
                        return networkActivityTracker.track(vpnSettingsModel.fetch());
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
                    },
                    dashboardPlans(user, dashboardModel, networkActivityTracker, subscriptionModel) {
                        const promise = subscriptionModel.fetch().then(() => {
                            // Ensure it's called with the same currency as the dashboard
                            return dashboardModel.loadPlans(subscriptionModel.currency());
                        });
                        return networkActivityTracker.track(promise);
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
                            return;
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
                        return isDelinquent.testAndRedirect();
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
                        return isDelinquent.testAndRedirect();
                    }
                },
                onEnter(AppModel) {
                    AppModel.set('inboxSidebar', true);
                    AppModel.set('contactSidebar', false);
                    AppModel.set('settingsSidebar', false);
                },
                onExit(AppModel) {
                    AppModel.set('showWelcome', false);
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
                onExit(dispatchers) {
                    const { dispatcher } = dispatchers(['unmarkMessages']);
                    dispatcher.unmarkMessages();
                }
            });
        });

        $urlRouterProvider.otherwise(($injector) => {
            const $state = $injector.get('$state');
            const stateName = $injector.get('authentication').isLoggedIn() ? 'secured.inbox' : 'login';
            return $state.href(stateName);
        });

        $locationProvider.html5Mode(true);
    }).name;
