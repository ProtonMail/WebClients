angular.module("proton.Controllers.Auth", ["proton.Auth"])

.controller("LoginController", function($rootScope, $state, $scope, authentication) {
  if ($state.is("login") && authentication.isLoggedIn()) {
    $state.go("login.unlock");
    return;
  }

  if (authentication.user) {
    $scope.user = authentication.user;
  }
  
  $rootScope.pageName = "Login";

  var clearErrors = function() {
    $scope.error = null;
  };

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
      function() { 
        $state.go("login.unlock");
        $scope.user = authentication.user;
      },
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

  $scope.keypress = function (event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      if ($state.is("login.unlock")) {
        $scope.decrypt();
      } else {
        $scope.login();
      }
    }
  };
})

.controller("SecuredController", function($scope, authentication) {
  $scope.user = authentication.user;
  $scope.logout = function() {
    authentication.logout();
  };
});
