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
    var mobileAndTabletcheck = false;

    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))){mobileAndTabletcheck = true;}})(navigator.userAgent||navigator.vendor||window.opera);

    $(window).bind('resize load', function() {
        $timeout.cancel(debounce);
        $timeout(function() {
            $rootScope.isMobile = mobileAndTabletcheck || ($(window).width() <= 767);
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
