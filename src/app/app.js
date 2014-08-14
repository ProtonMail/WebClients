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
    alert("Reported!");
  };
  $rootScope.$watch("pageName", function (name) {
    $document.find("title").html(name ? $filter("capitalize")(name) + " &middot; ProtonMail" : "ProtonMail");
  });
});
