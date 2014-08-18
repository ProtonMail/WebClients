angular.module("proton", [
  "ngAnimate",
  
  // templates
  "templates-app",
  "templates-common",
  
  // Basic
  "proton.Routes",
  "proton.Auth",
  "proton.Crypto",
  "proton.Models",

  "proton.tooltip",

  "proton.filters.strings",

  "proton.Controllers.Auth",
  "proton.Controllers.Messages",
  "proton.Controllers.Contacts",
  "proton.Controllers.Settings"
])

.run(function($document, $rootScope) {
  $rootScope.reportBug = function() {
    // Do something to report bug, maybe bring up a modal dialog.
  };

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
});
