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
  $document.find("title").html("{{ pageName | capitalize }} &middot; ProtonMail");
});
