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

.run(function($document, $rootScope) {
  if (typeof(pageName) != "undefined" && pageName !== null)
    $document.find("title").html("{{ pageName | capitalize }} &middot; ProtonMail");
  $rootScope.reportBug = function() {
    alert("Reported!");
  };
});
