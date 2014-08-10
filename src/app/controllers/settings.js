angular.module("proton.Controllers.Settings", [
  "ngRoute",
  "proton.Routes"
])

.controller("SettingsController", function($state, $stateParams, $scope, $rootScope, authentication) {
  $rootScope.pageName = "settings";
});
