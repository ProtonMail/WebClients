angular.module("proton", [
  "ngAnimate",
  "ngSanitize",

  "LocalStorageModule",
  "btford.markdown",

  // templates
  "templates-app",
  "templates-common",

  // App
  "proton.Routes",
  "proton.Models",

  // Services
  "proton.Auth",
  "proton.Crypto",
  "proton.errorReporter",
  "proton.networkActivity",
  "proton.Messages",

  // Directives
  "proton.tooltip",
  "proton.richTextEditor",
  "proton.emailField",

  // Filters
  "proton.filters.strings",

  // Controllers
  "proton.Controllers.Admin",
  "proton.Controllers.Auth",
  "proton.Controllers.Messages",
  "proton.Controllers.Contacts",
  "proton.Controllers.Settings"
])

.run(function($document, $state, $rootScope, networkActivityTracker) {

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
})

.factory('$exceptionHandler', function ($injector) {
  return function (exception, cause) {
    var errorReporter = $injector.get("errorReporter");
    if (exception.message.indexOf("$sanitize:badparse") >= 0) {
      errorReporter.notify("There was an error while trying to display this message.", exception);
    }
  };
});
