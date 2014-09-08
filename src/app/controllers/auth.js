angular.module("proton.controllers.Auth", ["proton.authentication"])

.controller("LoginController", function($rootScope, $state, $scope, authentication, login, networkActivityTracker) {

  if ($state.is("login") && authentication.isLoggedIn()) {
    $state.go("login.unlock");
    return;
  } else if ($state.is("login.unlock")) {

  }
  $rootScope.user = undefined;
  $rootScope.pageName = "Login";

  var clearErrors = function() {
    $scope.error = null;
  };

  $scope.logout = function() {
    clearErrors();
    authentication.logout();
  };

  $scope.tryLogin = function() {
    clearErrors();
    console.log(login);
    login(this);
  };

  $scope.tryDecrypt = function() {
    clearErrors();
    networkActivityTracker.track(
      authentication
        .unlockWithPassword(this.mailboxPassword)
        .then(
          function() {
            $state.go("secured.inbox");
          },
          function(err) {
            $scope.error = err;
          }
        )
    );
  };

  $scope.keypress = function (event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      if ($state.is("login.unlock")) {
        $scope.tryDecrypt.call(this);
      } else {
        $scope.tryLogin.call(this);
      }
    }
  };
})

.controller("SecuredController", function(
  $scope,
  $interval,
  $rootScope,
  $http,
  authentication,
  mailboxIdentifiers
) {
  var mailboxes = mailboxIdentifiers;

  $scope.user = authentication.user;
  $scope.logout = authentication.logout;

  $rootScope.isLoggedIn = true;
  $rootScope.isLocked = false;

  var fetchCounts = function() {
    $http.get(authentication.baseURL + "/messages/count?Location=" + mailboxes.inbox).then(function (resp) {
      $rootScope.unreadCount = resp.data.MessageCount.UnRead;
    });
    $http.get(authentication.baseURL + "/messages/count?Location=" + mailboxes.drafts).then(function (resp) {
      $rootScope.draftsCount = resp.data.MessageCount.Total;
    });
  };

  var updates = $interval(fetchCounts, 10000);
  fetchCounts();

  $scope.$on("$destroy", function () {
    $interval.cancel(updates);
  });
});
