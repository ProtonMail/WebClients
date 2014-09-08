angular.module("proton.controllers.Settings", [
  "proton.routes"
])

.controller("SettingsController", function($state, $stateParams, $scope, $rootScope, authentication) {
  $rootScope.pageName = "settings";
});
