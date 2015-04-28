angular.module("proton", [
  // "ngAnimate",
  "ngSanitize",
  "LocalStorageModule",
  "btford.markdown",
  "angularFileUpload",
  "cgNotify",

  // templates
  "templates-app",
  "templates-common",

  // App
  "proton.routes",
  "proton.models",

  // Services
  "proton.authentication",
  "proton.pmcrypto",
  "proton.errorReporter",
  "proton.networkActivity",
  "proton.messages",
  "proton.modals",
  "proton.attachments",
  "proton.tools",

  // Directives
  "proton.tooltip",
  "proton.richTextEditor",
  "proton.emailField",
  "proton.enter",
  "proton.slider",
  "proton.delayedPassword",
  "proton.fieldMatch",
  "proton.fieldFocus",

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
  "proton.controllers.Support"
])

.run(function(
  $document,
  $rootScope,
  networkActivityTracker,
  notify
) {

  $(window).bind('resize load',function(){
    $rootScope.isMobile = ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || $(window).width()<500 ) ? true : false;
  });
  $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
    setTimeout( function() {
      $('.panel-body input').eq(0).focus();
    }, 400);
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
  $rootScope.$watchGroup(["pageName", "unreadCount"], function (values) {
    $document.find("title").html(pageTitleTemplate({pageName: values[0], unreadCount: values[1]}));
  });
  $rootScope.networkActivity = networkActivityTracker;
  // notification service config
  notify.config({
    withCross: true,
    templateUrl: 'templates/partials/notification.tpl.html',
    duration: 5000, // The default duration (in milliseconds) of each message. A duration of 0 will prevent messages from closing automatically.
    position: 'center', // The default position of each message
    maximumOpen: 5 // The maximum number of total notifications that can be visible at one time. Older notifications will be closed when the maximum is reached.
  });
})

//
// Redirection if not authentified
//

.run(function($rootScope, $location, $state, authentication) {
    $rootScope.$on( '$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        var isLogin = toState.name.indexOf("login") !== -1;
        var isSupport = toState.name.indexOf("support") !== -1;
        var isAccount = toState.name.indexOf("account") !== -1;

        if(isLogin || isSupport || isAccount){
           return; // no need to redirect
        }

        // now, redirect only not authenticated
        if(!!!authentication.isLoggedIn()) {
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
      $state.go("support.message", {data: {
        title: rejection.error,
        content: rejection.error_description,
        type: "alert-danger"
      }});
  });
})

//
// Setup keyboard bindings
//

.run(function (
  $state,
  $stateParams
) {
  Mousetrap.bind(["ctrl+n", "c"], function () {
    if ($state.includes("secured.**")) {
      $state.go("secured.compose");
    }
  });
  Mousetrap.bind(["i"], function () {
    if ($state.includes("secured.**")) {
      $state.go("secured.inbox");
    }
  });
  Mousetrap.bind(["s"], function () {
    if ($state.includes("secured.**")) {
      $state.go("secured.starred");
    }
  });
  Mousetrap.bind(["d"], function () {
    if ($state.includes("secured.**")) {
      $state.go("secured.drafts");
    }
  });
  Mousetrap.bind("r", function () {
    if ($state.includes("secured.*.message")) {
      $state.go("secured.reply", {
        action: 'reply',
        id: $stateParams.MessageID
      })
    }
  });
  Mousetrap.bind("f", function () {
    if ($state.includes("secured.*.message")) {
      $state.go("secured.reply", {
        action: 'forward',
        id: $stateParams.MessageID
      })
    }
  });
})

//
// Handle some application exceptions
//

.factory('$exceptionHandler', function ($injector) {
  return function (exception, cause) {
    var errorReporter = $injector.get("errorReporter");
    if (exception.message.indexOf("$sanitize:badparse") >= 0) {
      errorReporter.notify("There was an error while trying to display this message.", exception);
    }
  };
});
