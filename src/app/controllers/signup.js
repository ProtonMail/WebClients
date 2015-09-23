angular.module("proton.controllers.Signup", ["proton.tools"])

.controller("SignupController", function(
    $scope,
    tools,
    $log,
    $rootScope,
    $state,
    $stateParams,
    $translate,
    $q,
    $timeout,
    $http,
    CONSTANTS,
    authentication,
    networkActivityTracker,
    User,
    Reset,
    pmcw,
    notify
) {
    // var mellt = new Mellt();

    $scope.initialization = function() {
        $log.debug('Signup:initialization');
        // Variables
        $scope.tools    = tools;
        $scope.compatibility = tools.isCompatible();

        $scope.creating =           false;
        $scope.genNewKeys =         false;
        $scope.createUser =         false;
        $scope.logUserIn =          false;
        $scope.decryptAccessToken = false;
        $scope.mailboxLogin =       false;
        $scope.getUserInfo =        false;
        $scope.finishCreation =     false;

        $scope.maxPW = CONSTANTS.LOGIN_PW_MAX_LEN;

        $scope.account = [];

        // Prepoppulate the username if from an invite link
        // and mark as read only
        if ($rootScope.username!==undefined) {
            $scope.account.Username = $rootScope.username;
            $scope.readOnlyUsername = true;
        }

    };

    // ---------------------------------------------------
    // ---------------------------------------------------
    // Creation Functions
    // ---------------------------------------------------
    // ---------------------------------------------------

    $scope.start = function() {
        $state.go('step1');
    };

    $scope.saveContinue = function(form) {

        if (form.$valid) {

            $log.debug($scope.account);

            // custom validation
            if ($scope.account.loginPasswordConfirm!==$scope.account.loginPassword) {
                return;
            }

            networkActivityTracker.track(
                $scope.checkAvailability()
                .then( $scope.generateNewKeys )
                .then( $scope.doCreateUser )
                .then( $scope.doLogUserIn )
                .then( $scope.doDecryptAccessToken )
                .then( $scope.doMailboxLogin )
                .then( $scope.doGetUserInfo )
                .then( $scope.finishRedirect )
                .catch( function(err) {
                    var msg = err;
                    if (typeof msg !== "string") {
                        msg = err.toString();
                    }
                    if (typeof msg !== "string") {
                        msg = "Something went wrong";
                    }
                    notify({
                        classes: 'notification-danger',
                        message: msg
                    });
                    $scope.signupError= true;
                })
            );
        }
    };

    $scope.finish = function(form) {
        $log.debug('finish');
        if (form.$valid) {
            $log.debug('finish: form valid');
            return $scope.generateKeys($scope.account.Username, $scope.account.mailboxPassword);
        }
    };

    $scope.finishLoginReset = function(form) {
        $log.debug('finishLoginReset');
    };

    $scope.generateKeys = function(userID, pass) {
        var deferred = $q.defer();

        $log.debug('generateKeys');

        pmcw.generateKeysRSA(userID, pass).then(
            function(response) {
                $log.debug(response);
                $scope.account.PublicKey = response.publicKeyArmored;
                $scope.account.PrivateKey = response.privateKeyArmored;
                $log.debug('pmcw.generateKeysRSA:resolved');
                deferred.resolve(response);
            },
            function(err) {
                $log.error(err);
                $scope.error = err;
                deferred.reject(err);
            }
        );

        return deferred.promise;
    };

    $scope.checkAvailability = function() {

        var deferred = $q.defer();

        $log.debug('checkAvailability');

        // user came from pre-invite so we can not check if it exists
        if ($rootScope.allowedNewAccount===true) {
            $scope.creating = true;
            deferred.resolve(200);
        }
        else {
            User.available({ username: $scope.account.Username }).$promise
            .then(
                function(response) {
                    if (response.data) {
                        var error_message = (response.data.Error) ? response.data.Error : (response.statusText) ? response.statusText : 'Error.';
                        $('#Username').focus();
                        deferred.reject(error_message);
                    }
                    else if (parseInt(response.Available)===0) {
                        $('#Username').focus();
                        deferred.reject('Username already taken.');
                        $log.debug('username taken');
                    }
                    else {
                        $scope.creating = true;
                        deferred.resolve(200);
                    }
                }
            );
        }

        return deferred.promise;
    };

    $scope.generateNewKeys = function() {
        $log.debug('generateNewKeys');
        $scope.genNewKeys   = true;
        var mbpw;
        if ($scope.account.mailboxPasswordConfirm!==undefined) {
            mbpw = $scope.account.mailboxPasswordConfirm;
        }
        else if ($scope.account.mailboxPassword!==undefined) {
            mbpw = $scope.account.mailboxPassword;
        }
        return $scope.generateKeys($scope.account.Username + '@protonmail.ch', mbpw);
    };

    $scope.doCreateUser = function() {
        $log.debug('doCreateUser', $rootScope.inviteToken);
        if ($rootScope.inviteToken===undefined) {
            notify({
                message: "Invalid or missing invite token."
            });
            return;
        }
        else {
            var params = {
                "response_type": "token",
                "client_id": "demoapp",
                "client_secret": "demopass",
                "grant_type": "password",
                "redirect_uri": "https://protonmail.ch",
                "state": "random_string",
                "Username": $scope.account.Username,
                "Password": $scope.account.loginPassword,
                "Email": $scope.account.notificationEmail,
                "News": !!($scope.account.optIn),
                "PublicKey": $scope.account.PublicKey,
                "PrivateKey": $scope.account.PrivateKey,
                "token": $rootScope.inviteToken // this needs to be from their email in the future. will be captcha when we remove the waiting list
            };
            if ($rootScope.tempUser===undefined) {
                $rootScope.tempUser = [];
            }
            $rootScope.tempUser.username = $scope.account.Username;
            $rootScope.tempUser.password = $scope.account.loginPassword;
            return User.create(params).$promise.then( function(response) {
                $log.debug(response);
                if (response.Code===1000) {
                    $scope.createUser  = true;
                }
                return response;
            });
        }
    };

    $scope.doLogUserIn = function(response) {
        $log.debug('doLogUserIn', response);
        if (response.Code && response.Code===1000) {
            $log.debug(
                $rootScope.tempUser.username,
                $rootScope.tempUser.password
            );
            $scope.logUserIn   = true;
            return authentication.loginWithCredentials({
                Username: $rootScope.tempUser.username,
                Password: $rootScope.tempUser.password
            });
        }
        else {
            var deferred = $q.defer();
            deferred.reject(response.Error);
            return deferred.promise;
        }
    };

    $scope.doDecryptAccessToken = function(response) {
        $log.debug('doDecryptAccessToken', response);
        $scope.authResponse = response.data;
        $scope.decryptAccessToken = true;
        return pmcw.decryptPrivateKey(
            $scope.authResponse.EncPrivateKey,
            $scope.account.mailboxPassword
        );
    };

    $scope.doMailboxLogin = function() {
        $log.debug('doMailboxLogin');
        $scope.mailboxLogin  = true;
        return authentication.unlockWithPassword(
            $scope.authResponse.EncPrivateKey,
            $scope.account.mailboxPassword,
            $scope.authResponse.AccessToken,
            $scope.authResponse
        ).then(
            function(response) {
                $log.debug('doMailboxLogin:unlockWithPassword:',response);
                return authentication.setAuthCookie()
                .then(
                    function(resp) {
                        $log.debug('setAuthCookie:resp'+resp);
                        window.sessionStorage.setItem(CONSTANTS.MAILBOX_PASSWORD_KEY, pmcw.encode_utf8_base64($scope.account.mailboxPassword));
                        $state.go("secured.inbox");
                    }
                );
            }
        );
    };

    $scope.doGetUserInfo = function() {
        $log.debug('getUserInfo');
        $scope.getUserInfo  = true;
        return authentication.fetchUserInfo($scope.authResponse.Uid);
    };

    $scope.finishRedirect = function() {
        $log.debug('finishRedirect');
        var deferred = $q.defer();
        $scope.finishCreation = true;
        window.sessionStorage.setItem(
            CONSTANTS.MAILBOX_PASSWORD_KEY,
            pmcw.encode_utf8_base64($scope.account.mailboxPassword)
        );
        // delete $rootScope.tempUser;
        // TODO: not all promises are resolved, so we simply refresh.
        $timeout( function() {
            window.location = '/inbox';
        }, 100);
        deferred.resolve(200);
        return deferred.promise;
    };

    $scope.initialization();

});
