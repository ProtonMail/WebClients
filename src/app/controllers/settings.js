angular.module("proton.Controllers.Settings", [
  "proton.Routes"
])

.controller("SettingsController", function($state, $stateParams, $scope, $rootScope, authentication) {
  $rootScope.pageName = "settings";
});
