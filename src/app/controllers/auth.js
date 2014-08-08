angular.module("proton.Controllers.Auth", ["proton.Auth"])
.controller("LoginController", function($rootScope, $state, $scope, authentication, protonBuild) {
  if ($state.is("login") && authentication.isLoggedIn()) {
    $state.go("login.unlock");
    return;
  }
  
  $rootScope.pageName = "Login";

  var clearErrors = function() {
    $scope.error = null;
  };

  $scope.build = protonBuild;

  $scope.logout = function() {
    clearErrors();
    authentication.logout();
  };

  $scope.login = function() {
    clearErrors();
    authentication.loginWithCredentials({
      username: $("#username").val(),
      password: $("#password").val()
    }).then(
      function() { $state.go("login.unlock"); },
      function(err) { $scope.error = err; }
    );
  };

  $scope.decrypt = function() {
    clearErrors();
    authentication
      .unlockWithPassword($("#mailboxPassword").val())
      .then(
        function() { $state.go("secured.inbox"); },
        function(err) { $scope.error = err; }
      );
  };
});
