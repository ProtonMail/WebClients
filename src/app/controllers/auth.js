angular.module("proton.Controllers.Auth", ["proton.Auth"])
.controller("LoginController", function($rootScope, $state, $scope, authentication, protonBuild) {
  if ($state.is("login") && authentication.isLoggedIn()) {
    $state.go("login.unlock");
    return;
  }
  
  $rootScope.pageName = "Login";

  $scope.build = protonBuild;
  $scope.submit = function() {
    authentication.loginWithCredentials({
      username: $("#username").val(),
      password: $("#password").val()
    }).then(function() {
      $state.go("login.unlock");
    });
  };
});
