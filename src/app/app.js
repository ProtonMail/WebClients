angular.module("proton", [
    // "ngAnimate", // We can't use the `ngAnimate`, it causes delays on application and also a problem with the iframe sandbox.
    "ngSanitize",
    "ngResource",
    "ngCookies",
    "btford.markdown",
    "ngFileUpload",
    "cgNotify",
    "pikaday",
    "toggle-switch",
    "pascalprecht.translate",
    "ui.bootstrap",
    "ngDragDrop",

    // Constant
    "proton.constants",

    // templates
    "templates-app",
    "templates-common",

    // App
    "proton.routes",

    // Models
    "proton.models",
    "proton.models.label",
    "proton.models.message",
    "proton.models.contact",
    "proton.models.user",
    "proton.models.reset",
    "proton.models.bug",
    "proton.models.setting",
    "proton.models.attachment",
    "proton.models.eo",
    "proton.models.logs",
    "proton.models.events",

    // Config
    "proton.config",

    // Services
    "proton.authentication",
    "proton.pmcw",
    "proton.errorReporter",
    "proton.networkActivity",
    "proton.messages",
    "proton.messages.counts",
    "proton.modals",
    "proton.attachments",
    "proton.tools",
    "proton.contacts",
    "proton.event",

    // Directives
    "proton.tooltip",
    "proton.emailField",
    "proton.enter",
    "proton.squire",
    "proton.locationTag",
    "proton.dropzone",
    "proton.labels",
    "proton.countdown",

    // Filters
    "proton.filters.strings",

    // Controllers
    "proton.controllers.Account",
    "proton.controllers.Auth",
    "proton.controllers.Bug",
    "proton.controllers.Contacts",
    "proton.controllers.Header",
    "proton.controllers.Messages",
    "proton.controllers.Messages.List",
    "proton.controllers.Messages.View",
    "proton.controllers.Messages.Compose",
    "proton.controllers.Outside",
    "proton.controllers.Search",
    "proton.controllers.Settings",
    "proton.controllers.Sidebar",
    "proton.controllers.Signup",
    "proton.controllers.Support",
    "proton.controllers.Upgrade",
    "proton.controllers.Wizard",

    // Translations
    "proton.translations"
])

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


.run(function(
    $document,
    $rootScope,
    $state,
    $timeout,
    authentication,
    networkActivityTracker,
    notify,
    tools
) {
    var debounce;

    $(window).bind('resize load', function() {
        $timeout.cancel(debounce);
        $timeout(function() {
            $rootScope.isMobile = tools.findBootstrapEnvironment() === 'xs';
        }, 100);
    });

    $(window).bind('load', function() {
        if (window.location.hash==='#spin') {
            $('body').append('<style>.wrap, .btn{-webkit-animation: lateral 4s ease-in-out infinite;-moz-animation: lateral 4s ease-in-out infinite;}</style>');
        }
    });

    $rootScope.firstNameOnly = function() {
        var firstNameOnly;

        if(authentication.user) {
            firstNameOnly = authentication.user.DisplayName;
        } else {
            firstNameOnly = $rootScope.tempUser.username;
        }

        if (firstNameOnly.length>20) {
            firstNameOnly = firstNameOnly.substring(0,17)+'...';
        }

        return firstNameOnly;
    };

    $rootScope.browser = tools.getBrowser;
    $rootScope.terminal = false;
    $rootScope.updateMessage = false;

    var pageTitleTemplate = _.template(
        "<% if (pageName) { %>" +
        "${ pageName }" +
        " - " +
        "<% } %>" +
        "ProtonMail"
    );

    $rootScope.$watch('pageName', function(newVal, oldVal) {
        $document.find("title").html(pageTitleTemplate({ pageName: newVal }));
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
    return {
        response: function(response) {
            if (response.data.Code!==undefined) {
                // app update needd
                if (response.data.Code===5003) {
                    if ($rootScope.updateMessage===false) {
                        $rootScope.updateMessage = true;
                        $injector.get('notify')({
                            classes: 'notification-info noclose',
                            message: 'A new version of ProtonMail is available. Please refresh this page and then logout and log back in to automatically update.',
                            duration: '0'
                        });
                    }
                }
                else if(response.data.Code===5004) {
                    $injector.get('notify')({
                        classes: 'notification-danger',
                        message: 'Non-integer API version requested.'
                    });
                }
                // unsupported api
                else if (response.data.Code===5005) {
                    $injector.get('notify')({
                        classes: 'notification-danger',
                        message: 'Unsupported API version.'
                    });
                }
                // site offline
                else if (response.data.Code===7001) {
                    $injector.get('notify')({
                        classes: 'notification-info',
                        message: 'The ProtonMail API is offline: '+response.data.ErrorDescription
                    });
                }
            }
            return response || $q.when(response);
        },
        responseError: function(rejection) {
            // console.log(rejection);
            // console.log(rejection.config);
            if (rejection.status === 401) {
                if ($rootScope.doRefresh===true) {
                    $rootScope.doRefresh = false;
                    $injector.get('authentication').getRefreshCookie()
                    .then(
                        function() {
                            var $http = $injector.get('$http');
                            // console.log(rejection.config);
                            // rejection.config.headers.common['x-pm-session']
                            _.extend(rejection.config.headers, $http.defaults.headers.common);
                            return $http(rejection.config);
                        },
                        function() {
                            $injector.get('authentication').logout();
                            $injector.get('$state').go('login');
                        }
                    );
                }
                else {
                    $injector.get('authentication').logout();
                    $injector.get('$state').go('login');
                }
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
.run(function($rootScope, $location, $state, authentication, $log) {
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        var isLogin = (toState.name === "login");
        var isUpgrade = (toState.name === "upgrade");
        var isSupport = (toState.name.includes("support."));
        var isAccount = (toState.name === "account");
        var isSignup = (toState.name === "signup" || toState.name === "step1" || toState.name === "step2" || toState.name === "pre-invite");
        var isUnlock = (toState.name === "login.unlock");
        var isOutside = (toState.name.includes("eo"));
        var isReset = (toState.name.includes("reset"));

        $log.debug(toState.name);
        $log.debug('isLoggedIn',$rootScope.isLoggedIn);
        $log.debug('isLocked',$rootScope.isLocked);

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
        else if (isLogin || isSupport || isAccount || isSignup || isOutside || isUpgrade || isReset) {
            $log.debug('appjs:(isLogin || isSupport || isAccount || isSignup || isOutside || isUpgrade || isReset)');
            return; // no need to redirect
        }

        // now, redirect only not authenticated
        if (!!!authentication.isLoggedIn()) {
            event.preventDefault(); // stop current execution
            $state.go('login'); // go to login
        }
    });

    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        // Hide all the tooltip
        $('.tooltip').not(this).hide();

        // Close navbar on mobile
        $(".navbar-toggle").click();

        $rootScope.toState = toState.name.replace(".", "-");

        if($rootScope.scrollToBottom === true) {
            setTimeout(function() {
                $('#content').animate({
                    scrollTop: $("#pageBottom").offset().top
                }, 1);
            }, 10);

            $rootScope.scrollToBottom = false;
        }

        $('#loading').remove();
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
    $log.info('Find a security bug? security@protonmail.ch');
    $log.info('We\'re hiring! https://protonmail.ch/pages/join-us.html');
})

//
// Pikaday config (datepicker)
//

.config(['pikadayConfigProvider', function(pikaday) {
    pikaday.setConfig({
        format: "MM/DD/YYYY"
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

.run(function($rootScope) {
    $rootScope.isFileSaverSupported = !!(('download' in document.createElement('a')) || navigator.msSaveOrOpenBlob);
    // Set build config
    $rootScope.build = {
        "version":"2.0",
        "notes":"http://protonmail.dev/blog/",
        "date":"17 Apr. 2015"
    };
})

/**
 * Offline manager
 */
.run(function($rootScope, $window, notify) {
    $rootScope.online = navigator.onLine;

    $window.addEventListener('offline', function() {
        $rootScope.online = false;
        notify({message: 'You are not connected to the Internet.', classes: 'notification-danger', duration: 0});
    });

    $window.addEventListener('online', function() {
        $rootScope.online = true;
        notify.closeAll();
    });
})

//
// Handle some application exceptions
//

.factory('$exceptionHandler', function($injector) {
    return function(exception, cause) {
        var errorReporter = $injector.get("errorReporter");
        if (exception.message.indexOf("$sanitize:badparse") >= 0) {
            errorReporter.notify("There was an error while trying to display this message.", exception);
        }
    };
});
