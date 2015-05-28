angular.module("proton.controllers.Auth", [
    "proton.authentication",
    "proton.pmcw"
])

.controller("LoginController", function(
    $rootScope,
    $state,
    $scope,
    $log,
    authentication,
    localStorageService,
    networkActivityTracker,
    notify,
    pmcw
) {

    $rootScope.pageName = "Login";

    if ($rootScope.isLoggedIn && $rootScope.user === undefined) {
        try {
            $rootScope.user = authentication.fetchUserInfo();
        }
        catch(err) {
            alert(err);
        }
    }

    var clearErrors = function() {
        $scope.error = null;
    };

    $rootScope.tryLogin = function() {
        $('input').blur();
        clearErrors();

        networkActivityTracker.track(
            authentication.loginWithCredentials({
                username: $scope.username,
                password: $scope.password
            })
            .then(
                function(result) {
                	if (result.access_token) {
                        return authentication.fetchUserInfo()
                        .then(
                            function(user) {
                                if ($rootScope.pubKey === 'to be modified') {
                                    $state.go('step2');
                                    return;
                                } else {
                                    $state.go("login.unlock");
                                    return;
                                }
                            }
                        );                     
	                }
	                else if (result.error) {
	                	var error  = (result.error_description) ? result.error_description : result.error;
	                	notify({
	                        classes: 'notification-danger',
	                        message: error
	                    });
	                }
	                else {
	                	notify({
	                        classes: 'notification-danger',
	                        message: 'Unable to login.'
	                    });
	                }
	                return;
                },
                function(result) {
                    if (result.message===undefined) {
                        result.message = 'Sorry, our login server is down. Please try again later.';
                    }
                    notify({
                        classes: 'notification-danger',
                        message: result.message
                    });
                    $('input[name="Username"]').focus();
                }
            )
        );
    };

    $scope.tryDecrypt = function() {
        $('input').blur();
        var mailboxPassword = this.mailboxPassword;
        clearErrors();
        networkActivityTracker.track(
            authentication.unlockWithPassword(mailboxPassword)
            .then(
                function() {
                    localStorageService.bind($scope, 'protonmail_pw', pmcw.encode_utf8_base64(mailboxPassword));
                    $state.go("secured.inbox");
                },
                function(err) {
                    $log.error(err);
                    $scope.error = err;
                }
            )
            .catch(function(err) {
                alert(err);
            })
        );
    };

    $scope.keypress = function(event) {
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
    $rootScope.isSecure = authentication.isSecured;

    var fetchCounts = function() {
        $http.get(authentication.baseURL + "/messages/count?Location=" + mailboxes.inbox).then(function(resp) {
            $rootScope.unreadCount = resp.data.MessageCount.UnRead;
        });
        $http.get(authentication.baseURL + "/messages/count?Location=" + mailboxes.drafts).then(function(resp) {
            $rootScope.draftsCount = resp.data.MessageCount.Total;
        });
    };

    var updates = $interval(fetchCounts, 10000);

    fetchCounts();

    $scope.$on("$destroy", function() {
        $interval.cancel(updates);
    });
});
