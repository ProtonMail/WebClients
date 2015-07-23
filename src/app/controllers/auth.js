angular.module("proton.controllers.Auth", [
    "proton.authentication",
    "proton.pmcw",
    "proton.constants"
])

.controller("LoginController", function(
    $rootScope,
    $state,
    $scope,
    $log,
    $timeout,
    CONSTANTS,
    authentication,
    networkActivityTracker,
    notify,
    pmcw
) {
    $rootScope.pageName = "Login";

    if ($rootScope.tempUser===undefined) {
        $rootScope.tempUser = [];
    }

    if ($rootScope.isLoggedIn && $rootScope.isLocked === false && $rootScope.user === undefined) {
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

    // this does not add security and was only active for less than a day in 2013.
    // required for accounts created back then.
    // goal was to obfuscate the password in a basic manner.
    $scope.basicObfuscate = function(username, password) {
        var salt = username.toLowerCase();
        if (salt.indexOf("@") > -1) {
            salt = salt.match(/^([^@]*)@/)[1];
        }
        return pmcrypto.getHashedPassword(salt+password);
    };

    $rootScope.tryLogin = function() {
        $('input').blur();
        clearErrors();

        networkActivityTracker.track(
            authentication.loginWithCredentials({
                Username: $scope.username,
                Password: $scope.password,
                HashedPassword: $scope.basicObfuscate($scope.username, $scope.password)
            })
            .then(
                function(result) {
                    $log.debug('loginWithCredentials:result.data ', result);
                    if (result.data.Code!==undefined) {
                        if (result.data.Code===401) {
                            notify({
                                classes: 'notification-danger',
                                message: result.data.ErrorDescription
                            });
                        }
                    	else if (result.data.AccessToken) {
                            $rootScope.isLoggedIn = true;
                            $rootScope.tempUser = {};
                            $rootScope.tempUser.username = $scope.username;
                            $rootScope.tempUser.password = $scope.password;
                        
                            if (result.data.AccessToken.length < 50) {
                                return authentication.fetchUserInfo()
                                .then(
                                    function(response) {
                                        $state.go("login.unlock");
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
                            else {
                                // console.log('Going to unlock page.');
                                $state.go("login.unlock");
                                return;
                            }
    	                }
                    }
	                else if (result.Error) {
	                	var error  = (result.Code === 401) ? 'Wrong Username or Password' : (result.error_description) ? result.error_description : result.Error;
	                	notify({
	                        classes: 'notification-danger',
	                        message: error
	                    });
	                }
	                else {
	                	notify({
	                        classes: 'notification-danger',
	                        message: 'Unable to log you in.'
	                    });
	                }
	                return;
                },
                function(result) {
                    console.log(result);
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
            authentication.unlockWithPassword($rootScope.TemporaryEncryptedPrivateKeyChallenge, mailboxPassword, $rootScope.TemporaryEncryptedAccessToken, $rootScope.TemporaryAccessData)
            .then(
                function(resp) {
                    window.sessionStorage.setItem(CONSTANTS.MAILBOX_PASSWORD_KEY, pmcw.encode_base64(mailboxPassword));
                    $rootScope.domoArigato = true;
                    $state.go("secured.inbox");
                },
                function(err) {
                    // console.log(err);
                    notify({
                        classes: 'notification-danger',
                        message: err.message
                    });
                    $( "[type=password]" ).focus();
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
    $rootScope,
    authentication,
    eventManager
) {
    $scope.user = authentication.user;
    $scope.logout = authentication.logout;

    eventManager.start(authentication.user.EventID);

    $rootScope.isLoggedIn = true;
    $rootScope.isLocked = false;
    $rootScope.isSecure = authentication.isSecured;
});
