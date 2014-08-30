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

  // Filters
  "proton.filters.strings",

  // Controllers
  "proton.Controllers.Admin",
  "proton.Controllers.Auth",
  "proton.Controllers.Messages",
  "proton.Controllers.Contacts",
  "proton.Controllers.Settings"
])

.run(function($document, $rootScope, networkActivityTracker) {

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
});
