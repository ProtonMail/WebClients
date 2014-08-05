angular.module("proton", [
  "ngRoute",
  
  // templates
  "templates-app",
  "templates-common",
  
  "proton.Routes",
  "proton.Auth",
  "proton.Models",

  "proton.Controllers.Messages",
  "proton.Controllers.Contacts"
])

.run(function($document) {
  $document.find("title").html("{{ pageName }} &middot; ProtonMail");
});
