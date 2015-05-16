angular.module("proton", [
    "ngAnimate",
    "ngSanitize",
    "LocalStorageModule",
    "btford.markdown",
    "ngFileUpload",
    "cgNotify",
    "pikaday",
    "toggle-switch",

    // templates
    "templates-app",
    "templates-common",

    // App
    "proton.routes",
    "proton.models",

    // Services
    "proton.authentication",
    "proton.pmcw",
    "proton.errorReporter",
    "proton.networkActivity",
    "proton.messages",
    "proton.modals",
    "proton.attachments",
    "proton.tools",

    // Directives
    "proton.tooltip",
    // "proton.richTextEditor",
    "proton.emailField",
    "proton.enter",
    "proton.slider",
    "proton.delayedPassword",
    "proton.fieldMatch",
    "proton.fieldFocus",
    "proton.squire",
    "proton.dropzone",
    "proton.ondrag",

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
    "proton.controllers.Search",
    "proton.controllers.Settings",
    "proton.controllers.Sidebar",
    "proton.controllers.Support"
])

.run(function(
    $document,
    $rootScope,
    networkActivityTracker,
    notify,
    $state
) {

    $(window).bind('resize load', function() {
        $rootScope.isMobile = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || $(window).width() < 500) ? true : false;
    });
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {     
        setTimeout(function() {
            $('.panel-body input').eq(0).focus();
        }, 200);
    })
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
    // notification service config
    notify.config({
        withCross: true,
        templateUrl: 'templates/notifications/base.tpl.html',
        duration: 5000, // The default duration (in milliseconds) of each message. A duration of 0 will prevent messages from closing automatically.
        position: 'center', // The default position of each message
        maximumOpen: 5 // The maximum number of total notifications that can be visible at one time. Older notifications will be closed when the maximum is reached.
    });
})

//
// Redirection if not authentified
//

.run(function($rootScope, $location, $state, authentication) {
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {

        var isLogin = (toState.name == "login");
        var isSupport = (toState.name == "support");
        var isAccount = (toState.name == "account");
        var isSignup = (toState.name == "signup" || toState.name == "step1" || toState.name == "step2");
        var isUnlock = (toState.name == "login.unlock");

        if ($rootScope.isLoggedIn && isLogin) {
            event.preventDefault();
            $state.go('login.unlock');
        }

        else if ($rootScope.isLoggedIn && !$rootScope.isLocked && isUnlock) {
            event.preventDefault();
            $state.go('secured.inbox');
        }
        
        else if (isLogin || isSupport || isAccount || isSignup) {
            return; // no need to redirect
        }

        // now, redirect only not authenticated
        if (!!!authentication.isLoggedIn()) {
            event.preventDefault(); // stop current execution
            $state.go('login'); // go to login
        }    
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
    Mousetrap.bind(["ctrl+n", "c"], function() {
        if ($state.includes("secured.**")) {
            $state.go("secured.compose");
        }
    });
    Mousetrap.bind(["i"], function() {
        if ($state.includes("secured.**")) {
            $state.go("secured.inbox");
        }
    });
    Mousetrap.bind(["s"], function() {
        if ($state.includes("secured.**")) {
            $state.go("secured.starred");
        }
    });
    Mousetrap.bind(["d"], function() {
        if ($state.includes("secured.**")) {
            $state.go("secured.drafts");
        }
    });
    Mousetrap.bind("r", function() {
        if ($state.includes("secured.*.message")) {
            $state.go("secured.reply", {
                action: 'reply',
                id: $stateParams.MessageID
            })
        }
    });
    Mousetrap.bind("f", function() {
        if ($state.includes("secured.*.message")) {
            $state.go("secured.reply", {
                action: 'forward',
                id: $stateParams.MessageID
            })
        }
    });
})

//
// Pikaday config (datepicker)
//

.config(['pikadayConfigProvider', function(pikaday) {
    pikaday.setConfig({
        format: "MM/DD/YYYY"
    });
}])

.run(function($rootScope) {
    $rootScope.build = {
        "version":"2.0",
        "notes":"http://protonmail.dev/blog/",
        "date":"17 Apr. 2015"
    };
})

.config(function(authenticationProvider) {
    authenticationProvider.setAPIBaseURL("http://protonmail.xyz");
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
