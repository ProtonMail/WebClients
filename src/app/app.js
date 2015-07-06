// TODO... when refreshing inbox, displayname vanishes?

angular.module("proton", [
    // "ngAnimate", // We can't use the `ngAnimate`, it causes delays on application and also a problem with the iframe sandbox.
    "ngSanitize",
    "ngResource",
    "ngCookies",
    "LocalStorageModule",
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
    "proton.delayedPassword",
    "proton.fieldMatch",
    "proton.fieldFocus",
    "proton.squire",
    "proton.locationTag",
    "proton.dropzone",
    "proton.labels",

    // Filters
    "proton.filters.strings",

    // Controllers
    "proton.controllers.Account",
    "proton.controllers.Admin",
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
    "proton.controllers.Support",
    "proton.controllers.Upgrade",
    "proton.controllers.Wizard",

    // Translations
    "proton.translations"
])

.run(function(
    $document,
    $rootScope,
    networkActivityTracker,
    notify,
    $state,
    tools,
    authentication
) {
    $(window).bind('resize load', function() {
        $rootScope.isMobile = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || $(window).width() < 500) ? true : false;
        resizeComposer();
    });
    $(window).bind('load', function() {
        resizeComposer();
        if (window.location.hash==='#spin') {
            $('body').append('<style>.wrap, .btn{-webkit-animation: lateral 4s ease-in-out infinite;-moz-animation: lateral 4s ease-in-out infinite;}</style>');
        }
    });

    $rootScope.firstNameOnly = function() {
        var firstNameOnly;
        var emailFirst = authentication.user.DisplayName.split('@');
        if (emailFirst[0]===authentication.user.Name) {
            firstNameOnly = emailFirst[0];
        }
        else {
            firstNameOnly = authentication.user.DisplayName.split(' ');
            firstNameOnly = firstNameOnly[0];
        }
        return firstNameOnly;
    };

    $rootScope.browser = tools.getBrowser;
    $rootScope.terminal = false;
    var pageTitleTemplate = _.template(
        "<% if (pageName) { %>" +
        "${ _.string.capitalize(pageName) }" +
        "<% if (unreadCount) { %>" +
        " (&thinsp;${unreadCount}&thinsp;)" +
        "<% } %> " +
        "&middot; " +
        "<% } %>" +
        "ProtonMail"
    );
    $rootScope.$watchGroup(["pageName", "unreadCount"], function(values) {
        $document.find("title").html(pageTitleTemplate({
            pageName: values[0],
            unreadCount: values[1]
        }));
    });
    $rootScope.networkActivity = networkActivityTracker;
    $rootScope.toggleSidebar = false;
    // notification service config
    // https://github.com/cgross/angular-notify
    notify.config({
        templateUrl: 'templates/notifications/base.tpl.html',
        duration: 60000,
        position: 'center',
        maximumOpen: 5
    });
})

//
// Redirection if not authentified
//


.run(function($rootScope, $location, $state, authentication) {
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        var isLogin = (toState.name === "login");
        var isUpgrade = (toState.name === "upgrade");
        var isSupport = (toState.name.includes("support."));
        var isAccount = (toState.name === "account");
        var isSignup = (toState.name === "signup" || toState.name === "step1" || toState.name === "step2");
        var isUnlock = (toState.name === "login.unlock");
        var isOutside = (toState.name.includes("eo"));

        // If already logged in and on the login page: redirect to unlock page
        if ($rootScope.isLoggedIn && isLogin) {
            event.preventDefault();
            $state.go('login.unlock');
        }

        // If already logged in and unlocked and on the unlock page: redirect to inbox
        else if ($rootScope.isLoggedIn && !$rootScope.isLocked && isUnlock) {
            event.preventDefault();
            $state.go('secured.inbox');
        }

        // if on the login, support, account, or signup pages dont require authentication
        else if (isLogin || isSupport || isAccount || isSignup || isOutside || isUpgrade) {
            return; // no need to redirect
        }

        // now, redirect only not authenticated
        if (!!!authentication.isLoggedIn()) {
            event.preventDefault(); // stop current execution
            $state.go('login'); // go to login
        }
    });
    $rootScope.$on('$viewContentLoading', function(event, viewConfig) {

    });

    $rootScope.$on('$viewContentLoaded', function ($evt, data) {

    });

    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        $rootScope.toState = toState.name.replace(".", "-");
        if ($rootScope.scrollToBottom===true) {
            setTimeout(function() {
                $('#content').animate({
                    scrollTop: $("#pageBottom").offset().top
                }, 1);
            }, 10);
            $rootScope.scrollToBottom = false;
        }
        $('#loading-css').remove();
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
    $log.info('We\'re hiring! https://protonmail.ch/pages/join-us');
})

//
// Setup keyboard bindings
//

.run(function(
    $state,
    $stateParams
) {
    // Mousetrap.bind(["ctrl+n", "c"], function() {
    //     if ($state.includes("secured.**")) {
    //         $state.go("secured.compose");
    //     }
    // });
    // Mousetrap.bind(["i"], function() {
    //     if ($state.includes("secured.**")) {
    //         $state.go("secured.inbox");
    //     }
    // });
    // Mousetrap.bind(["s"], function() {
    //     if ($state.includes("secured.**")) {
    //         $state.go("secured.starred");
    //     }
    // });
    // Mousetrap.bind(["d"], function() {
    //     if ($state.includes("secured.**")) {
    //         $state.go("secured.drafts");
    //     }
    // });
    // Mousetrap.bind("r", function() {
    //     if ($state.includes("secured.*.message")) {
    //         $state.go("secured.reply", {
    //             action: 'reply',
    //             id: $stateParams.ID
    //         });
    //     }
    // });
    // Mousetrap.bind("f", function() {
    //     if ($state.includes("secured.*.message")) {
    //         $state.go("secured.reply", {
    //             action: 'forward',
    //             id: $stateParams.ID
    //         });
    //     }
    // });
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

.run(function($rootScope) {
    $rootScope.build = {
        "version":"2.0",
        "notes":"http://protonmail.dev/blog/",
        "date":"17 Apr. 2015"
    };
})

.config(function(authenticationProvider, CONFIG) {
    authenticationProvider.setAPIBaseURL(CONFIG.apiUrl);
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
