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

  "proton.filters.strings",

  "proton.Controllers.Auth",
  "proton.Controllers.Messages",
  "proton.Controllers.Contacts",
  "proton.Controllers.Settings"
])

.run(function($document, $rootScope, $filter) {
  $rootScope.reportBug = function() {
    // Do something to report bug, maybe bring up a modal dialog.
  };

  var pageTitleTemplate = _.template(
    "<% if (pageName) { %>" +
      "${ _.string.capitalize(pageName) }" +
      "<% if (counter) { %>" +
        " (&thinsp;${counter}&thinsp;)" +
      "<% } %> " +
      "&middot; " +
    "<% } %>" +
    "ProtonMail"
  );

  $rootScope.$watchGroup(["pageName", "counter"], function (values) {
    $document.find("title").html(pageTitleTemplate({pageName: values[0], counter: values[1]}));
  });
});
