angular.module('proton', [
    'gettext',
    'as.sortable',
    'cgNotify',
    'ngCookies',
    'ngIcal',
    'ngMessages',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'pikaday',
    'ui.router',

    // Constant
    'proton.constants',
    'proton.core',

    // templates
    'templates-app',

    // App
    'proton.routes',
    'proton.composer',

    // Models
    'proton.models.addresses',
    'proton.models.contact',
    'proton.models.conversations',
    'proton.models.domains',
    'proton.models.eo',
    'proton.models.events',
    'proton.models.filter',
    'proton.models.incomingDefaults',
    'proton.models.invite',
    'proton.models.keys',
    'proton.models.label',
    'proton.models.logs',
    'proton.models.memberKeys',
    'proton.models.members',
    'proton.models.message',
    'proton.models.organization',
    'proton.models.payments',
    'proton.models.reset',
    'proton.models.setting',
    'proton.models.user',
    'proton.models',
    'proton.bugReport',

    // Config
    'proton.config',

    'proton.ui',

    // Services
    'proton.attachments',
    'proton.authentication',
    'proton.cache',
    'proton.errorReporter',
    'proton.event',
    'proton.networkActivity',
    'proton.pmcw',
    'proton.tools',
    'proton.desktopNotifications',
    'proton.embedded',
    'proton.service.message',

    // Directives
    'proton.address',
    'proton.message',
    'proton.conversation',
    'proton.card',
    'proton.compareTo',
    'proton.star',
    'proton.drag',
    'proton.dropdown',
    'proton.dropzone',
    'proton.hotkeys',
    'proton.enter',
    'proton.height',
    'proton.heightOutside',
    'proton.labelHeight',
    'proton.labels',
    'proton.loaderTag',
    'proton.login',
    'proton.loginTwoFactor',
    'proton.locationTag',
    'proton.phone',
    'proton.responsiveComposer',
    'proton.sidebarHeight',
    'proton.squire',
    'proton.time',
    'proton.toggle',
    'proton.tooltip',
    'proton.translate',
    'proton.wizard',
    'proton.rightClick',
    'proton.selectConversation',
    'proton.detectTimeWidth',

    // Filters
    'proton.filters',

    // Controllers
    'proton.controllers.Auth',
    'proton.controllers.Contacts',
    'proton.controllers.Header',
    'proton.controllers.Conversations',
    'proton.controllers.Compose',
    'proton.controllers.Outside',
    'proton.controllers.Reset',
    'proton.controllers.Secured',
    'proton.controllers.Settings',
    'proton.controllers.Sidebar',
    'proton.controllers.Setup',
    'proton.controllers.Signup',
    'proton.controllers.Support',
    'proton.controllers.Upgrade'
])

/**
 * Check if the current browser owns some requirements
 */
.config(() => {
    const isGoodPrngAvailable = function () {
        if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
            return true;
        } else if (typeof window !== 'undefined' && typeof window.msCrypto === 'object' && typeof window.msCrypto.getRandomValues === 'function') {
            return true;
        }

        return false;
    };

    const isSessionStorageAvailable = function () {
        return (typeof (sessionStorage) !== 'undefined');
    };

    if (isSessionStorageAvailable() === false) {
        alert('Error: sessionStorage is required to use ProtonMail.');
        setTimeout(() => {
            window.location = 'https://protonmail.com/support/knowledge-base/sessionstorage/';
        }, 1000);
    }

    if (isGoodPrngAvailable() === false) {
        alert('Error: a PRNG is required to use ProtonMail.');
        setTimeout(() => {
            window.location = 'https://protonmail.com/support/knowledge-base/prng/';
        }, 1000);
    }
})

// Set base url from grunt config
.provider('url', function urlProvider() {
    let base;

    this.setBaseUrl = function (newUrl) {
        base = newUrl;
    };

    this.$get = function () {
        return {
            get() {
                return base;
            }
        };
    };
})

.config((urlProvider, CONFIG) => {
    urlProvider.setBaseUrl(CONFIG.apiUrl);
})

.run((CONFIG, gettextCatalog) => {
    const locale = window.navigator.userLanguage || window.navigator.language;

    gettextCatalog.setCurrentLanguage('en_US');
    gettextCatalog.debug = CONFIG.debug || false;
    moment.locale(locale);
})

.run((
    $document,
    $rootScope,
    $state,
    $timeout,
    $window,
    logoutManager, // Keep the logoutManager here to lunch it
    authentication,
    networkActivityTracker,
    CONSTANTS,
    notify,
    tools
) => {
    // angular.element($window).bind('load', () => {
    //     // Enable FastClick
    //     FastClick.attach(document.body);

    //     if (window.location.hash === '#spin-me-right-round') {
    //         $('body').append('<style>body > div * {-webkit-animation: spin 10s ease-in-out infinite;-moz-animation: spin 10s ease-in-out infinite;}</style>');
    //     }
    // });

    // Manage responsive changes
    window.addEventListener('resize', _.debounce(tools.mobileResponsive, 50));
    window.addEventListener('orientationchange', tools.mobileResponsive);
    tools.mobileResponsive();

    // Less than 1030 / Tablet Mode
    // can pass in show (true/false) to explicity show/hide
    $rootScope.$on('sidebarMobileToggle', (event, show) => {
        if (typeof show !== 'undefined') {
            $rootScope.showSidebar = show;
        } else {
            $rootScope.showSidebar = !$rootScope.showSidebar;
        }
    });

    $rootScope.mobileMode = false;
    $rootScope.sidebarMode = true;
    $rootScope.showWelcome = true;
    $rootScope.welcome = false;
    $rootScope.browser = tools.getBrowser();
    $rootScope.terminal = false;
    // $rootScope.updateMessage = false;
    $rootScope.showSidebar = false;
    $rootScope.themeJason = false;
    $rootScope.isLoggedIn = authentication.isLoggedIn();
    $rootScope.isLocked = authentication.isLocked();
    $rootScope.isSecure = authentication.isSecured();

    // SVG Polyfill for Edge
    window.svg4everybody();
    window.svgeezy.init(false, 'png');
    // Set new relative time thresholds
    moment.relativeTimeThreshold('s', 59); // s seconds least number of seconds to be considered a minute
    moment.relativeTimeThreshold('m', 59); // m minutes least number of minutes to be considered an hour
    moment.relativeTimeThreshold('h', 23); // h hours   least number of hours to be considered a day
    // Manage page title
    $rootScope.$watch('pageName', (newVal) => {
        if (newVal) {
            document.title = newVal + ' | ProtonMail';
        } else {
            document.title = 'ProtonMail';
        }
    });

    $rootScope.networkActivity = networkActivityTracker;
    $rootScope.toggleSidebar = false;

    // notification service config
    // https://github.com/cgross/angular-notify
    notify.config({
        templateUrl: 'templates/notifications/base.tpl.html',
        duration: 6000,
        position: 'center',
        maximumOpen: 5
    });
})

.config(($httpProvider, CONFIG) => {
    // Http Intercpetor to check auth failures for xhr requests
    $httpProvider.interceptors.push('authHttpResponseInterceptor');
    $httpProvider.defaults.headers.common['x-pm-appversion'] = 'Web_' + CONFIG.app_version;
    $httpProvider.defaults.headers.common['x-pm-apiversion'] = CONFIG.api_version;
    $httpProvider.defaults.headers.common.Accept = 'application/vnd.protonmail.v1+json';
    $httpProvider.defaults.withCredentials = true;

    // initialize get if not there
    if (angular.isUndefined($httpProvider.defaults.headers.get)) {
        $httpProvider.defaults.headers.get = {};
    }

    // disable IE ajax request caching (don't use If-Modified-Since)
    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.get.Pragma = 'no-cache';
})
.run(($rootScope, $location, $state, authentication, $log, $timeout, networkActivityTracker) => {
    $rootScope.$on('$stateChangeStart', (event, toState) => {

        networkActivityTracker.clear();

        const isLogin = (toState.name === 'login');
        const isUpgrade = (toState.name === 'upgrade');
        const isSupport = (toState.name.includes('support'));
        const isAccount = (toState.name === 'account');
        const isSignup = (toState.name === 'signup' || toState.name === 'pre-invite');
        const isUnlock = (toState.name === 'login.unlock');
        const isOutside = (toState.name.includes('eo'));
        const isReset = (toState.name.includes('reset'));
        const isPrinter = (toState.name === 'printer');

        if (isUnlock && $rootScope.isLoggedIn) {
            $log.debug('appjs:(isUnlock && $rootScope.isLoggedIn)');
            return;
        } else if ($rootScope.isLoggedIn && !$rootScope.isLocked && isUnlock) {
        // If already logged in and unlocked and on the unlock page: redirect to inbox
            $log.debug('appjs:($rootScope.isLoggedIn && !$rootScope.isLocked && isUnlock)');
            event.preventDefault();
            $state.go('secured.inbox');
            return;
        } else if (isLogin || isSupport || isAccount || isSignup || isOutside || isUpgrade || isReset || isPrinter) {
            // if on the login, support, account, or signup pages dont require authentication
            $log.debug('appjs:(isLogin || isSupport || isAccount || isSignup || isOutside || isUpgrade || isReset || isPrinter)');
            return; // no need to redirect
        }

        // now, redirect only not authenticated
        if (!authentication.isLoggedIn()) {
            event.preventDefault(); // stop current execution
            $state.go('login'); // go to login
        }
    });

    $rootScope.$on('$stateChangeSuccess', function (event, toState) {
        // Change page name
        $rootScope.$broadcast('updatePageName');

        // Hide all the tooltip
        $('.tooltip').not(this).hide();

        // Close navbar on mobile
        $('.navbar-toggle').click();

        $rootScope.toState = toState.name.replace('.', '-');

        $('#loading_pm, #pm_slow, #pm_slow2').remove();

        $timeout(() => {
            $rootScope.showSidebar = false;
        }, 30);
    });
})

//
// Rejection manager
//

.run(($rootScope, $state, $log) => {
    $rootScope.$on('$routeChangeError', (event, current, previous, rejection) => {
        $log.error(rejection);
        $state.go('support.message', {
            data: {
                title: rejection.error,
                content: rejection.error_description,
                type: 'alert-danger'
            }
        });
    });
})

//
// Console messages
//

.run(($log) => {
    const styles = {
        spam: 'color: #505061; font-size: 14px;',
        strong: 'color: #505061; font-size: 14px; font-weight: bold;',
        link: 'color: #9397cd; font-size: 14px;  '
    };

    $log.info('%cFind a %csecurity bug?%c🐛 security@protonmail.ch', styles.spam, styles.strong, styles.link);
    $log.info('%c⛰ We\'re %chiring! %chttps://protonmail.com/careers', styles.spam, styles.strong, styles.link);

})

//
// Pikaday config (datepicker)
//

.config(['pikadayConfigProvider', function (pikaday) {
    let format;
    const language = window.navigator.userLanguage || window.navigator.language;

    if (language === 'en-US') {
        format = 'MM/DD/YYYY';
    } else {
        format = 'DD/MM/YYYY';
    }

    pikaday.setConfig({
        format
    });
}])

.config(($compileProvider, CONFIG) => {
    // By default AngularJS attaches information about binding and scopes to DOM nodes,
    // and adds CSS classes to data-bound elements
    // Tools like Protractor and Batarang need this information to run,
    // but you can disable this in production for a significant performance boost
    const debugInfo = CONFIG.debug || false;
    // configure routeProvider as usual
    $compileProvider.debugInfoEnabled(debugInfo);
})

.config(($logProvider, CONFIG) => {
    // By default AngularJS attaches information about binding and scopes to DOM nodes,
    // and adds CSS classes to data-bound elements
    // Tools like Protractor and Batarang need this information to run,
    // but you can disable this in production for a significant performance boost
    const debugInfo = CONFIG.debug || false;
    // configure routeProvider as usual
    $logProvider.debugEnabled(debugInfo);
})

.run(($rootScope, CONFIG) => {
    $rootScope.app_version = CONFIG.app_version;
    $rootScope.date_version = CONFIG.date_version;
});
