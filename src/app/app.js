angular.module('proton', [
    'cgNotify',
    'ngCookies',
    'ngFileUpload',
    'ngResource',
    'ngSanitize',
    'ngTouch',
    'pascalprecht.translate',
    'pikaday',
    'ui.sortable',
    'ngIcal',
    'SmoothScrollbar',

    // Constant
    'proton.constants',

    // templates
    'templates-app',
    'templates-common',

    // App
    'proton.routes',

    // Models
    'proton.models',
    'proton.models.label',
    'proton.models.message',
    'proton.models.contact',
    'proton.models.user',
    'proton.models.reset',
    'proton.models.bug',
    'proton.models.setting',
    'proton.models.attachment',
    'proton.models.eo',
    'proton.models.logs',
    'proton.models.events',
    'proton.models.payments',
    'proton.models.organization',
    'proton.models.members',
    'proton.models.memberKeys',
    'proton.models.addresses',
    'proton.models.domains',
    'proton.models.conversations',

    // Config
    'proton.config',

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

    // Directives
    'proton.autocomplete',
    'proton.dropdown',
    'proton.dropzone',
    'proton.enter',
    'proton.height',
    'proton.heightOutside',
    'proton.labelHeight',
    'proton.labels',
    'proton.loaderTag',
    'proton.locationTag',
    'proton.move',
    'proton.responsiveComposer',
    'proton.sample',
    'proton.sidebarHeight',
    'proton.squire',
    'proton.time',
    'proton.toggle',
    'proton.tooltip',
    'proton.transformation',
    'proton.maxComposerHeight',

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
    'proton.controllers.Upgrade',
    'proton.controllers.Wizard',

    // Translations
    'proton.translations'
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

/**
 * Load stripe script
 * https://stripe.com/docs/stripe.js
 */
.config(function() {
    var script = document.createElement('script');

    script.type= 'text/javascript';
    script.src = 'https://js.stripe.com/v2/';
    document.body.appendChild(script);
})

.run(function(CONSTANTS) {
    // This function clears junk from session storage. Should not be needed forever
    try {
        var whitelist = [
            CONSTANTS.EVENT_ID,
            CONSTANTS.MAILBOX_PASSWORD_KEY,
            CONSTANTS.OAUTH_KEY+":SessionToken",
            CONSTANTS.OAUTH_KEY + ":Uid",
            CONSTANTS.OAUTH_KEY + ":AccessToken",
            CONSTANTS.OAUTH_KEY + ":RefreshToken",
            "proton:decrypted_token",
            "proton:encrypted_password"
        ];

        var data = {};
        for( var i=0; i<whitelist.length; i++) {
            var item = window.sessionStorage.getItem(whitelist[i]);
            if( angular.isString(item) ) {
                data[whitelist[i]] = item;
            }
        }

        window.sessionStorage.clear();

        for (var key in data) {
            window.sessionStorage.setItem(key, data[key]);
        }
    }
    catch(err) {
        // Do nothing, session storage support checked for elsewhere
    }
})

.run(function(
    $document,
    $rootScope,
    $state,
    $timeout,
    $window,
    $cookies,
    Bug,
    authentication,
    networkActivityTracker,
    notify,
    tools
) {
    angular.element($window).bind('load', function() {
        if (window.location.hash==='#spin') {
            $('body').append('<style>.wrap, .btn{-webkit-animation: lateral 4s ease-in-out infinite;-moz-animation: lateral 4s ease-in-out infinite;}</style>');
        }
    });

    // Less than 1024 / Tablet Mode
    $rootScope.$on('sidebarMobileToggle', function() {
        $rootScope.showSidebar = !$rootScope.showSidebar;
    });

    $rootScope.showWelcome = true;
    $rootScope.browser = tools.getBrowser();
    $rootScope.terminal = false;
    $rootScope.updateMessage = false;
    $rootScope.showSidebar = false;
    $rootScope.themeJason = false;
    $rootScope.isLoggedIn = authentication.isLoggedIn();
    $rootScope.isLocked = authentication.isLocked();
    $rootScope.isSecure = authentication.isSecured();
    $rootScope.pmFeedback = false;



    // ===================================
    // FEEDBACK FORM (TEMPORARY - REMOVE ON SUNDAY / MONDAY)
    $timeout( function() {
        if ( !$cookies.get( 'v3_feedback' ) ) {
            $cookies.put('v3_feedback', 'true');
            $rootScope.pmFeedback = true;
        }
    }, 120000); // 2 mins

    $rootScope.closePmFeedBack = function() {
        $rootScope.pmFeedback = false;
    };
    $rootScope.sendPmFeedBack = function() {
        data = {};
        data.OS = '--';
        data.OSVersion = '--';
        data.Browser = '--';
        data.BrowserVersion = '--';
        data.BrowserExtensions = '--';
        data.Client = '--';
        data.ClientVersion = '--';
        data.Title = '[FEEDBACK v3]';
        data.Description = '--';
        data.Username = '--';
        data.Email = '--';
        data.Description = this.fdbckTxt;
        console.log(data);
        var feedbackPromise = Bug.report(data);
        feedbackPromise.then(
            function(response) {
                if(response.data.Code === 1000) {
                    notify({message: 'Thanks for the feedback!', classes: 'notification-success'});
                } else if (angular.isDefined(response.data.Error)) {
                    notify({message: response.data.Error, classes: 'notification-danger'});
                }
                $rootScope.pmFeedback = false;
            },
            function(err) {
                error.message = 'Error during the sending feedback';
                $rootScope.pmFeedback = false;
            }
        );
    };
    // END FEEDBACK
    // ===================================



    // SVG Polyfill for Edge
    svg4everybody();

    // FastClick polyfill for mobile devices
    // https://github.com/ftlabs/fastclick
    FastClick.attach(document.body);

    // Manage page title
    var pageTitleTemplate = _.template(
        "<% if (pageName) { %>" +
        "${ pageName }" +
        " - " +
        "<% } %>" +
        "ProtonMail"
    );

    $rootScope.$watch('pageName', function(newVal, oldVal) {
        $document.find("title").text(pageTitleTemplate({ pageName: newVal }));
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

    return {
        response: function(response) {
            // Close notification if Internet wake up
            if(notification) {
                notification.close();
                notification = false;
            }

            if (angular.isDefined(response.data) && angular.isDefined(response.data.Code)) {
                // app update needd
                if (response.data.Code === 5003) {
                    if ($rootScope.updateMessage===false) {
                        $rootScope.updateMessage = true;
                        $injector.get('notify')({
                            classes: 'notification-info noclose',
                            message: 'A new version of ProtonMail is available. Please refresh this page and then logout and log back in to automatically update.',
                            duration: '0'
                        });
                    }
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
                        message: 'Not connected to Internet.',
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
                            $injector.get('authentication').logout(true);
                        }
                    );
                } else {
                    $injector.get('authentication').logout(true);
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
.run(function($rootScope, $location, $state, authentication, $log, $timeout, networkActivityTracker) {
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {

        networkActivityTracker.clear();

        var isLogin = (toState.name === "login");
        var isUpgrade = (toState.name === "upgrade");
        var isSupport = (toState.name.includes("support"));
        var isAccount = (toState.name === "account");
        var isSignup = (toState.name === "signup" || toState.name === "step1" || toState.name === "step2" || toState.name === "pre-invite");
        var isUnlock = (toState.name === "login.unlock");
        var isOutside = (toState.name.includes("eo"));
        var isReset = (toState.name.includes("reset"));

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
        // Change page name
        $rootScope.$broadcast('updatePageName');

        // Hide all the tooltip
        $('.tooltip').not(this).hide();

        // Close navbar on mobile
        $(".navbar-toggle").click();

        $rootScope.toState = toState.name.replace(".", "-");

        if($rootScope.scrollToBottom === true) {
            if($("#pm_list")) {
                $timeout(function() {
                    $('#content').animate({
                        scrollTop: $("#pm_list").offset().top
                    }, 1);
                }, 100);
            }

            $rootScope.scrollToBottom = false;
        }

        $('#loading_pm, #pm_slow, #pm_slow2').remove();
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
    $log.info('Find a security bug? security@protonmail.com');
    $log.info('We\'re hiring! https://protonmail.com/pages/join-us.html');
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
 * Detect if the user use safari private mode
 */
.run(function(notify, tools) {
    if(tools.hasSessionStorage() === false) {
        notify({
            message: 'You are in Private Mode or have Session Storage disabled.\nPlease deactivate Private Mode and then reload the page.',
            classes: 'notification-danger',
            duration: 0
        });
    }
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
                    OS:             tools.getOs,
                    OSVersion:      '',
                    Browser:         tools.getBrowser,
                    BrowserVersion:  tools.getBrowserVersion,
                    Client:         'Angular',
                    ClientVersion:  CONFIG.app_version,
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
