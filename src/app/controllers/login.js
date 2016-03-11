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
    $http,
    $location,
    CONSTANTS,
    CONFIG,
    authentication,
    networkActivityTracker,
    notify,
    loginModal,
    pmcw,
    tools
) {
    $rootScope.pageName = "Login";
    $rootScope.app_version = CONFIG.app_version;
    $rootScope.date_version = CONFIG.date_version;
    $rootScope.tempUser = $rootScope.tempUser || [];
    $scope.maxPW = CONSTANTS.LOGIN_PW_MAX_LEN;

    if ($rootScope.isLoggedIn && $rootScope.isLocked === false && $rootScope.user === undefined) {
        try {
            $rootScope.user = authentication.fetchUserInfo();
        }
        catch(err) {
            $log.error('appjs',err);
            alert(err);
        }
    }

    var clearErrors = function() {
        $scope.error = null;
        notify.closeAll();
    };

    $scope.initialization = function() {
        var ua = window.navigator.userAgent;
        var iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
        var webkit = !!ua.match(/WebKit/i);
        var iOSSafari = iOS && webkit && !ua.match(/CriOS/i);

        if (iOSSafari) {
            // Don't focus the input field
        } else {
            $('input.focus').focus();
        }

        // If #help
        if ($location.hash() === 'help') {
            $scope.getLoginHelp();
        }

        // Detect if the current browser have session storage enable
        if (tools.hasSessionStorage() === false) {
            notify({
                message: 'You are in Private Mode or have Session Storage disabled.\nPlease deactivate Private Mode and then reload the page.\n<a href="// Detect if the current browser have cookie enable" target="_blank">More information here</a>.',
                classes: 'notification-danger',
                duration: '0'
            });
        }

        // Detect if the current browser have cookie enable
        if (tools.hasCookie() === false) {
            notify({
                message: 'Cookie are disabled.\nPlease activate it and then reload the page.\n<a href="// Detect if the current browser have cookie enable" target="_blank">More information here</a>.',
                classes: 'notification-danger',
                duration: '0'
            });
        }
    };

    /**
     * Open login modal to help the user
     */
    $scope.getLoginHelp = function() {
        loginModal.activate({
            params: {
                cancel: function() {
                    loginModal.deactivate();
                }
            }
        });
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

    $scope.login = function() {
        angular.element('input').blur();
        angular.element('#pm_login').attr({action:'/*'});
        clearErrors();

        // Check username and password
        if(
            angular.isUndefined($scope.username) ||
            angular.isUndefined($scope.password) ||
            $scope.username.length === 0 ||
            $scope.password.length === 0
        ) {
            notify({
                classes: 'notification-danger',
                message: 'Please enter your username and password.'
            });
            return;
        }

        // Transform to lowercase and remove the domain
        $scope.username = $scope.username.toLowerCase();

        // Custom validation
        try {
            if (pmcw.encode_utf8($scope.password).length > CONSTANTS.LOGIN_PW_MAX_LEN) {
                notify({
                    classes: 'notification-danger',
                    message: 'Passwords are limited to '+CONSTANTS.LOGIN_PW_MAX_LEN+' characters.'
                });
                return;
            }
        } catch(err) {
            notify({
                classes: 'notification-danger',
                message: err.message
            });
            return;
        }

        networkActivityTracker.track(
            authentication.loginWithCredentials({
                Username: $scope.username,
                Password: $scope.password
            })
            .then(
                function(result) {
                    $log.debug('loginWithCredentials:result.data ', result);
                    if (angular.isDefined(result.data) && angular.isDefined(result.data.Code) && result.data.Code === 401) {

                        $scope.selectPassword();

                        notify({
                            classes: 'notification-danger',
                            message: result.data.ErrorDescription
                        });
                    } else if (angular.isDefined(result.data) && angular.isDefined(result.data.Code) && result.data.Code === 10002) {
                        var message;

                        if (result.data.Error) {
                            message = result.data.Error;
                        } else {
                            message = "Your account has been disabled.";
                        }
                        // This account is disabled.
                        notify({
                            classes: 'notification-danger',
                            message: message
                        });
                    } else if (angular.isDefined(result.data) && angular.isDefined(result.data.AccessToken)) {
                        // TODO: where is tempUser used?
                        $rootScope.isLoggedIn = true;
                        $rootScope.tempUser = {
                            username: $scope.username,
                            password: $scope.password
                        };

                        $state.go('login.unlock');
                        return;
                    } else if (angular.isDefined(result.data) && angular.isDefined(result.data.Code) && result.data.Code === 5003) {
                        // Nothing
                    } else if (angular.isDefined(result.data) && angular.isDefined(result.data.Error)) {
                        // TODO: This might be buggy
	                	var error  = (angular.isDefined(result.data.ErrorDescription) && result.data.ErrorDescription.length) ? result.data.ErrorDescription : result.data.Error;

                        notify({
	                        classes: 'notification-danger',
	                        message: error
	                    });
	                } else {
	                	notify({
	                        classes: 'notification-danger',
	                        message: 'Unable to log you in.'
	                    });
	                }
                },
                function(result) {
                    if (result.message === undefined) {
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

    $scope.unlock = function() {
        // Make local so extensions (or Angular) can't mess with it by clearing the form too early
        var mailboxPassword = $scope.mailboxPassword;

        clearErrors();

        networkActivityTracker.track(
            authentication.unlockWithPassword(
                $rootScope.TemporaryEncryptedPrivateKeyChallenge,
                mailboxPassword,
                $rootScope.TemporaryEncryptedAccessToken,
                $rootScope.TemporaryAccessData
            )
            .then(
                function(resp) {
                    $log.debug('unlockWithPassword:resp'+resp);
                    return authentication.setAuthCookie()
                    .then(
                        function(resp) {
                            $log.debug('setAuthCookie:resp'+resp);
                            authentication.savePassword(mailboxPassword);
                            $rootScope.isLoggedIn = authentication.isLoggedIn();
                            $rootScope.isLocked = authentication.isLocked();
                            $rootScope.isSecure = authentication.isSecured();
                            $state.go("secured.inbox");
                        },
                        function(err) {
                            $log.error('unlock', err);
                            notify({
                                classes: 'notification-danger',
                                message: err.message
                            });
                            $( "[type=password]" ).focus();
                        }
                    );
                },
                function(err) {
                    $log.error('unlock', err);

                    // clear password for user
                    $scope.selectPassword();

                    notify({
                        classes: 'notification-danger',
                        message: err.message
                    });
                }
            )
        );
    };

    $scope.selectPassword = function() {
        var input = $('#password');

        input.focus();
        input.select();
    };

    $scope.initialization();
});
