/**
 * The requestAnimationFrame polyfill
 * Paul Irish.
 * {@link http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/}
 */
window._rAF = window._rAF || (function() {
  return window.requestAnimationFrame ||
     window.webkitRequestAnimationFrame ||
     window.mozRequestAnimationFrame ||
     function(callback) {
       window.setTimeout(callback, 16);
     };
})();


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

    // templates
    'templates-app',

    // App
    'proton.routes',
    'proton.composer',

    // Models
    'proton.models.addresses',
    'proton.models.attachment',
    'proton.models.bug',
    'proton.models.contact',
    'proton.models.conversations',
    'proton.models.domains',
    'proton.models.eo',
    'proton.models.events',
    'proton.models.filter',
    'proton.models.incomingDefaults',
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

    // Config
    'proton.config',

    'proton.ui',

    // Services
    'proton.actions',
    'proton.attachments',
    'proton.authentication',
    'proton.cache',
    'proton.errorReporter',
    'proton.event',
    'proton.modals',
    'proton.networkActivity',
    'proton.pmcw',
    'proton.tools',
    'proton.desktopNotifications',
    'proton.embedded',
    'proton.service.message',

    // Directives
    'proton.message',
    'proton.conversation',
    'proton.card',
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
    'proton.locationTag',
    'proton.maxComposerHeight',
    'proton.move',
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
    'proton.images',

    // Filters
    'proton.filters',

    // Controllers
    'proton.controllers.Setup',
    'proton.controllers.Auth',
    'proton.controllers.Contacts',
    'proton.controllers.Header',
    'proton.controllers.Conversation',
    'proton.controllers.Conversations',
    'proton.controllers.Message',
    'proton.controllers.Compose',
    'proton.controllers.Outside',
    'proton.controllers.Secured',
    'proton.controllers.Settings',
    'proton.controllers.Sidebar',
    'proton.controllers.Signup',
    'proton.controllers.Support',
    'proton.controllers.Upgrade'
])

/**
 * Check if the current browser owns some requirements
 */
.config(function() {
    var is_good_prng_available = function() {
        if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
            return true;
        } else if (typeof window !== 'undefined' && typeof window.msCrypto === 'object' && typeof window.msCrypto.getRandomValues === 'function') {
            return true;
        } else {
            return false;
        }
    };

    var isSessionStorage_available = function() {
        return (typeof(sessionStorage) !== 'undefined');
    };

    if(isSessionStorage_available() === false) {
        alert('Error: sessionStorage is required to use ProtonMail.');
        setTimeout( function() {
            window.location = 'https://protonmail.com/support/knowledge-base/sessionstorage/';
        }, 1000);
    }

    if(is_good_prng_available() === false) {
        alert('Error: a PRNG is required to use ProtonMail.');
        setTimeout( function() {
            window.location = 'https://protonmail.com/support/knowledge-base/prng/';
        }, 1000);
    }
})

// Set base url from grunt config
.provider('url', function urlProvider() {
    var base;

    this.setBaseUrl = function(newUrl) {
        base = newUrl;
    };

    this.$get = function() {
        return {
            get: function() {
                return base;
            }
        };
    };
})

.config(function(urlProvider, CONFIG) {
    urlProvider.setBaseUrl(CONFIG.apiUrl);
})

.run(function (CONFIG, gettextCatalog) {
    var locale = window.navigator.userLanguage || window.navigator.language;

    gettextCatalog.setCurrentLanguage('en_US');
    gettextCatalog.debug = CONFIG.debug || false;
    moment.locale(locale);
})

.run(function(
    $document,
    $rootScope,
    $state,
    $timeout,
    $window,
    authentication,
    networkActivityTracker,
    CONSTANTS,
    notify,
    tools
) {
    angular.element($window).bind('load', function() {
        // Enable FastClick
        FastClick.attach(document.body);

        if (window.location.hash==='#spin-me-right-round') {
            $('body').append('<style>body > div * {-webkit-animation: spin 10s ease-in-out infinite;-moz-animation: spin 10s ease-in-out infinite;}</style>');
        }
    });

    // Manage responsive changes
    window.addEventListener('resize', _.debounce(tools.mobileResponsive, 50));
    window.addEventListener('orientationchange', tools.mobileResponsive);
    tools.mobileResponsive();

    // Less than 1030 / Tablet Mode
    // can pass in show (true/false) to explicity show/hide
    $rootScope.$on('sidebarMobileToggle', function(event, show) {
        if (typeof show !== "undefined") {
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
    //$rootScope.updateMessage = false;
    $rootScope.showSidebar = false;
    $rootScope.themeJason = false;
    $rootScope.isLoggedIn = authentication.isLoggedIn();
    $rootScope.isLocked = authentication.isLocked();
    $rootScope.isSecure = authentication.isSecured();

    // SVG Polyfill for Edge
    svg4everybody();
    svgeezy.init(false, 'png');

    // Set new relative time thresholds
    moment.relativeTimeThreshold('s', 59); // s	seconds	least number of seconds to be considered a minute
    moment.relativeTimeThreshold('m', 59); // m	minutes	least number of minutes to be considered an hour
    moment.relativeTimeThreshold('h', 23); // h	hours	least number of hours to be considered a day

    // Manage page title
    $rootScope.$watch('pageName', function(newVal, oldVal) {
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

//
// Redirection if not authentified
//
.factory('authHttpResponseInterceptor', function($q, $injector, $rootScope) {
    var notification = false;
    var upgrade_notification = false;

    return {
        response: function(response) {
            // Close notification if Internet wake up
            if (notification) {
                notification.close();
                notification = false;
            }

            if (angular.isDefined(response.data) && angular.isDefined(response.data.Code)) {
                // app update needd
                if (response.data.Code === 5003) {
                    if ( upgrade_notification ) {
                        upgrade_notification.close();
                    }

                    upgrade_notification = $injector.get('notify')({
                        classes: 'notification-info noclose',
                        message: 'A new version of ProtonMail is available. Please refresh this page and then logout and log back in to automatically update.',
                        duration: '0'
                    });
                }
                else if(response.data.Code === 5004) {
                    $injector.get('notify')({
                        classes: 'notification-danger',
                        message: 'Non-integer API version requested.'
                    });
                }
                // unsupported api
                else if (response.data.Code === 5005) {
                    $injector.get('notify')({
                        classes: 'notification-danger',
                        message: 'Unsupported API version.'
                    });
                }
                // site offline
                else if (response.data.Code === 7001) {
                    $injector.get('notify')({
                        classes: 'notification-info',
                        message: 'The ProtonMail API is offline: '+response.data.ErrorDescription
                    });
                }
            }

            return response || $q.when(response);
        },
        responseError: function(rejection) {
            if(rejection.status === 0 || rejection.status === -1) {
                if(navigator.onLine === true) {
                    notification = $injector.get('notify')({
                        message: 'Could not connect to server.',
                        classes: 'notification-danger'
                    });
                } else {
                    notification = $injector.get('notify')({
                        message: 'No Internet connection found.',
                        classes: 'notification-danger'
                    });
                }
            } else if (rejection.status === 401) {
                if ($rootScope.doRefresh === true) {
                    $rootScope.doRefresh = false;
                    $injector.get('authentication').getRefreshCookie()
                    .then(
                        function() {
                            var $http = $injector.get('$http');

                            _.extend(rejection.config.headers, $http.defaults.headers.common);
                            return $http(rejection.config);
                        },
                        function() {
                            $injector.get('authentication').logout(true, false);
                        }
                    );
                } else {
                    $injector.get('authentication').logout(true, false);
                }
            } else if (rejection.status === 403) {
                var $http = $injector.get('$http');
                var loginPasswordModal = $injector.get('loginPasswordModal');
                var User = $injector.get('User');
                var notify = $injector.get('notify');
                var eventManager = $injector.get('eventManager');
                var deferred = $q.defer();

                // Open the open to enter login password because this request require lock scope
                loginPasswordModal.activate({
                    params: {
                        submit: function(loginPassword) {
                            // Send request to unlock the current session for administrator privileges
                            User.unlock({Password: loginPassword})
                            .then(function(result) {
                                if (result.data && result.data.Error) {
                                    notify({message: result.data.Error, classes: 'notification-danger'});
                                }
                                // Close the modal
                                loginPasswordModal.deactivate();
                                // Resend request now
                                deferred.resolve($http(rejection.config));
                            }, function(error) {
                                notify({message: error, classes: 'notification-danger'});
                                deferred.reject();
                            });
                        },
                        cancel: function() {
                            loginPasswordModal.deactivate();
                            deferred.reject();
                        }
                    }
                });

                return deferred.promise;
            } else if ([408, 503, 504].indexOf(rejection.status) !== -1) {
                notification = $injector.get('notify')({
                    message: 'ProtonMail cannot be reached right now, please try again later.',
                    classes: 'notification-danger'
                });
            }

            return $q.reject(rejection);
        }
    };
})

.config(function($httpProvider, CONFIG) {
    //Http Intercpetor to check auth failures for xhr requests
    $httpProvider.interceptors.push('authHttpResponseInterceptor');
    $httpProvider.defaults.headers.common["x-pm-appversion"] = 'Web_' + CONFIG.app_version;
    $httpProvider.defaults.headers.common["x-pm-apiversion"] = CONFIG.api_version;
    $httpProvider.defaults.headers.common.Accept = "application/vnd.protonmail.v1+json";
    $httpProvider.defaults.withCredentials = true;

    //initialize get if not there
    if (angular.isUndefined($httpProvider.defaults.headers.get)) {
        $httpProvider.defaults.headers.get = {};
    }

    //disable IE ajax request caching (don't use If-Modified-Since)
    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.get.Pragma = 'no-cache';
})
.run(function($rootScope, $location, $state, authentication, $log, $timeout, networkActivityTracker) {
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {

        networkActivityTracker.clear();

        var isLogin = (toState.name === "login");
        var isUpgrade = (toState.name === "upgrade");
        var isSupport = (toState.name.includes("support"));
        var isAccount = (toState.name === "account");
        var isSignup = (toState.name === "signup" || toState.name === "subscription" || toState.name === "pre-invite");
        var isUnlock = (toState.name === "login.unlock");
        var isOutside = (toState.name.includes("eo"));
        var isReset = (toState.name.includes("reset"));
        var isPrinter = (toState.name === "printer");

        if (isUnlock && $rootScope.isLoggedIn) {
            $log.debug('appjs:(isUnlock && $rootScope.isLoggedIn)');
            return;
        }

        // If already logged in and unlocked and on the unlock page: redirect to inbox
        else if ($rootScope.isLoggedIn && !$rootScope.isLocked && isUnlock) {
            $log.debug('appjs:($rootScope.isLoggedIn && !$rootScope.isLocked && isUnlock)');
            event.preventDefault();
            $state.go('secured.inbox');
            return;
        }

        // if on the login, support, account, or signup pages dont require authentication
        else if (isLogin || isSupport || isAccount || isSignup || isOutside || isUpgrade || isReset || isPrinter) {
            $log.debug('appjs:(isLogin || isSupport || isAccount || isSignup || isOutside || isUpgrade || isReset || isPrinter)');
            return; // no need to redirect
        }

        // now, redirect only not authenticated
        if (!!!authentication.isLoggedIn()) {
            event.preventDefault(); // stop current execution
            $state.go('login'); // go to login
        }
    });

    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        // Change page name
        $rootScope.$broadcast('updatePageName');

        // Hide all the tooltip
        $('.tooltip').not(this).hide();

        // Close navbar on mobile
        $(".navbar-toggle").click();

        $rootScope.toState = toState.name.replace(".", "-");

        $('#loading_pm, #pm_slow, #pm_slow2').remove();

        $timeout( function() {
            $rootScope.showSidebar = false;
        }, 30);
    });
})

//
// Rejection manager
//

.run(function($rootScope, $state, $log) {
    $rootScope.$on("$routeChangeError", function(event, current, previous, rejection) {
        $log.error(rejection);
        $state.go("support.message", {
            data: {
                title: rejection.error,
                content: rejection.error_description,
                type: "alert-danger"
            }
        });
    });
})

//
// Console messages
//

.run(function($log) {
    var styles = {
      spam: "color: #505061; font-size: 14px;",
      strong: "color: #505061; font-size: 14px; font-weight: bold;",
      link: "color: #9397cd; font-size: 14px;  "
    };

    $log.info("%cFind a %csecurity bug?%c🐛 security@protonmail.ch",styles.spam, styles.strong, styles.link);
    $log.info("%c⛰ We\'re %chiring! %chttps://protonmail.com/careers",styles.spam, styles.strong, styles.link);

})

//
// Pikaday config (datepicker)
//

.config(['pikadayConfigProvider', function(pikaday) {
    var format;
    var language = window.navigator.userLanguage || window.navigator.language;

    if(language === 'en-US') {
        format = 'MM/DD/YYYY';
    } else {
        format = 'DD/MM/YYYY';
    }

    pikaday.setConfig({
        format: format
    });
}])

.config(function ($compileProvider, CONFIG) {
    // By default AngularJS attaches information about binding and scopes to DOM nodes,
    // and adds CSS classes to data-bound elements
    // Tools like Protractor and Batarang need this information to run,
    // but you can disable this in production for a significant performance boost
    var debugInfo = CONFIG.debug || false;
    //configure routeProvider as usual
    $compileProvider.debugInfoEnabled(debugInfo);
})

.config(function ($logProvider, CONFIG) {
    // By default AngularJS attaches information about binding and scopes to DOM nodes,
    // and adds CSS classes to data-bound elements
    // Tools like Protractor and Batarang need this information to run,
    // but you can disable this in production for a significant performance boost
    var debugInfo = CONFIG.debug || false;
    //configure routeProvider as usual
    $logProvider.debugEnabled(debugInfo);
})

.run(function($rootScope, CONFIG) {
    $rootScope.app_version = CONFIG.app_version;
    $rootScope.date_version = CONFIG.date_version;
    $rootScope.isFileSaverSupported = !!(('download' in document.createElement('a')) || navigator.msSaveOrOpenBlob);
})

//
// Handle some application exceptions
//

.factory('$exceptionHandler', function($log, $injector, CONFIG) { // function($injector, $log) {
    var n_reports = 0;
    return function(exception, cause) {
        n_reports++;
        $log.error( exception );

        if ( n_reports < 6 ) {
            var debug;
            if ( exception instanceof Error ) {
                debug = { 'message': exception.message, 'stack': exception.stack };
            }
            else if ( angular.isString( exception ) ) {
                debug = exception;
            }
            else {
                try {
                    var json = angular.toJson( exception );
                    if ( $.isEmptyObject( json ) ) {
                        debug = exception.toString();
                    }
                    else {
                        debug = exception;
                    }
                }
                catch(err) {
                    debug = err.message;
                }
            }

            try {
                var url = $injector.get("url");
                var $http = $injector.get("$http");
                var tools = $injector.get("tools");
                var $state = $injector.get("$state");
                var crashData = {
                    OS: tools.getOs(),
                    OSVersion: '',
                    Browser: tools.getBrowser(),
                    BrowserVersion: tools.getBrowserVersion(),
                    Client: 'Angular',
                    ClientVersion: CONFIG.app_version,
                    Debug: { 'state': $state.$current.name, 'error': debug },
                };
                crashPromise = $http.post( url.get() + '/bugs/crash', crashData )
                    .catch(function(err) {
                        // Do nothing
                    });
            }
            catch(err) {
                // Do nothing
            }
        }
    };
});
