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
    $window,
    CONSTANTS,
    authentication,
    domains,
    networkActivityTracker,
    User,
    Reset,
    pmcw,
    notify
) {
    $scope.initialization = function() {

        $log.debug('Signup:initialization');
        // Variables
        $scope.tools    = tools;
        $scope.compatibility = tools.isCompatible();
        $scope.creating = false;
        $scope.genNewKeys = false;
        $scope.createUser = false;
        $scope.logUserIn = false;
        $scope.decryptAccessToken = false;
        $scope.mailboxLogin = false;
        $scope.getUserInfo = false;
        $scope.finishCreation = false;

        $scope.signup = {};

        $scope.signup.verificationSent = false;
        $scope.generating = false;
        $scope.domains = [];

        // Populate the domains <select>
        _.each(domains, function(domain) {
            $scope.domains.push({label: domain, value: domain});
        });

        $scope.maxPW = CONSTANTS.LOGIN_PW_MAX_LEN;

        $scope.account = [];

        // Select the first domain
        $scope.account.domain = $scope.domains[0];

        // Initialize verification code
        $scope.account.codeVerification = '';

        // Initialize captcha token
        $scope.account.captcha_token = false;

        // Prepoppulate the username if from an invite link and mark as read only
        if (angular.isDefined($rootScope.username)) {
            $scope.account.Username = $rootScope.username;
            $scope.readOnlyUsername = true;
        } else {
            $scope.readOnlyUsername = false;
        }

        // Captcha
        window.addEventListener("message", captchaReceiveMessage, false);

        // FIX ME - Bart. Jan 18, 2016. Mon 2:29 PM.
        function captchaReceiveMessage(event) {
            if ( typeof event.origin === "undefined" && typeof event.originalEvent.origin === "undefined" ) {
                return;
            }

            // For Chrome, the origin property is in the event.originalEvent object.
            var origin = event.origin || event.originalEvent.origin;

            // Change window.location.origin to wherever this is hosted ( 'https://secure.protonmail.com:443' )
            if (origin !== 'https://secure.protonmail.com') {
                return;
            }

            var data = event.data;

            if ( data.type === "pm_captcha" ) {
                $scope.account.captcha_token = data.token;
                $scope.$apply();
            }

            if ( data.type === "pm_height" ) {
                $('#pm_captcha').height(event.data.height + 40);
            }
        }

        // Change this to our recaptcha key, configurable in Angular?
        var message = {
            "type": "pm_captcha",
            "language": "en",
            "key": "6LcWsBUTAAAAAOkRfBk-EXkGzOfcSz3CzvYbxfTn",
        };

        // Change window.location.origin to wherever this is hosted ( 'https://secure.protonmail.com:443' )
        window.captchaSendMessage = function() {
            iframe = document.getElementById('pm_captcha');
            iframe.contentWindow.postMessage(message, 'https://secure.protonmail.com');
        };

    };

    $scope.notificationEmailValidation = function() {
        if ($scope.account.notificationEmail.length > 0) {
            return !!!tools.validEmail($scope.account.notificationEmail);
        } else {
            return true;
        }
    };

    $scope.sendVerificationCode = function() {
        User.code({
            Username: $scope.account.Username,
            Type: 'email',
            Destination: {
                Address: $scope.account.emailVerification
            }
        }).$promise.then(function(response) {
            if (response.Code === 1000) {
                $scope.signup.verificationSent = true;
            } else if (response.Error) {
                notify({message: response.Error, classes: 'notification-danger'});
            }
        });
    };

    // ---------------------------------------------------
    // ---------------------------------------------------
    // Creation Functions
    // ---------------------------------------------------
    // ---------------------------------------------------

    $scope.start = function() {
        $state.go('step1');
    };

    $scope.createAccount = function() {

        $scope.creating = true;

        $scope.doCreateUser()
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
        });
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
                .then(
                    function() {
                        $timeout( function() {
                            $scope.genNewKeys = false;
                            if ($rootScope.preInvited) {
                                $scope.createAccount();
                            }
                            else {
                                $scope.humanityTest = true;
                            }
                        }, 2000);
                    },
                    function() {

                    }
                )
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

    /* manual means the fucntion was called outside of the automated chained functions. it will be set to true if triggered manually */
    $scope.checkAvailability = function( manual ) {
        var deferred = $q.defer();

        $log.debug('checkAvailability');

        // reset
        $scope.goodUsername = false;
        $scope.badUsername = false;
        $scope.checkingUsername = true;

        // user came from pre-invite so we can not check if it exists
        if ($rootScope.allowedNewAccount === true && manual !== true) {
            $scope.checkingUsername = false;
            deferred.resolve(200);
        } else {
            if ($scope.account.Username.length > 0) {
                User.available({ username: $scope.account.Username }).$promise
                .then(function(response) {
                    if (response.Available === 0) {
                        if ( manual === true ) {
                            $scope.badUsername = true;
                            $scope.checkingUsername = false;
                            deferred.resolve(200);
                        } else {
                            $('#Username').focus();
                            deferred.reject('Username already taken.');
                            $log.debug('username taken');
                        }
                    } else {
                        if ( manual === true ) {
                            $scope.goodUsername = true;
                            $scope.checkingUsername = false;
                            deferred.resolve(200);
                        } else {
                            $scope.checkingUsername = false;
                            deferred.resolve(200);
                        }
                    }
                });
            }
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
        return $scope.generateKeys($scope.account.Username + '@' + $scope.account.domain.value, mbpw);
    };

    $scope.doCreateUser = function() {

        $log.debug('doCreateUser: $scope.account.codeVerification', $scope.account.codeVerification);

        $log.debug('doCreateUser: inviteToken', $rootScope.inviteToken);
        $log.debug('doCreateUser: captcha_token', $scope.account.captcha_token);

        var params = {
            'Username': $scope.account.Username,
            'Password': $scope.account.loginPassword,
            'Domain': $scope.account.domain.value,
            'Email': $scope.account.notificationEmail,
            'News': !!($scope.account.optIn),
            'PrivateKey': $scope.account.PrivateKey
        };

        if (angular.isDefined($rootScope.inviteToken)) {
            $log.debug($scope.inviteToken);
            params.Token = $rootScope.inviteToken;
            params.TokenType = 'invite';
        } else if (angular.isDefined($scope.account.captcha_token) && $scope.account.captcha_token!==false) {
            $log.debug($scope.account.captcha_token);
            params.Token = $scope.account.captcha_token;
            params.TokenType = 'recaptcha';
        }
        else {
            params.Token = $scope.account.codeVerification;
            params.TokenType = 'email';
        }

        if ($rootScope.tempUser===undefined) {
            $rootScope.tempUser = [];
        }

        $log.debug(params);

        $rootScope.tempUser.username = $scope.account.Username;
        $rootScope.tempUser.password = $scope.account.loginPassword;

        return User.create(params).$promise.then( function(response) {
            $log.debug(response);
            if (response.Code===1000) {
                $scope.createUser  = true;
            }
            return response;
        });
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
