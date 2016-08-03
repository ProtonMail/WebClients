angular.module("proton.controllers.Signup", ["proton.tools", "proton.storage"])

.controller("SignupController", function(
    $http,
    $location,
    $log,
    $q,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    $window,
    authentication,
    CONSTANTS,
    direct,
    domains,
    gettextCatalog,
    networkActivityTracker,
    notify,
    Payment,
    plans,
    pmcw,
    Reset,
    tools,
    User,
    secureSessionStorage
) {
    var childWindow;

    $scope.initialization = function() {
        // Variables
        $scope.card = {};
        $scope.tools = tools;
        $scope.compatibility = tools.isCompatible();
        $scope.showFeatures = false;
        $scope.filling = true;
        $scope.payment = false;
        $scope.creating = false;
        $scope.genNewKeys = false;
        $scope.createUser = false;
        $scope.logUserIn = false;
        $scope.decryptAccessToken = false;
        $scope.mailboxLogin = false;
        $scope.getUserInfo = false;
        $scope.finishCreation = false;
        $scope.verifyCode = false;
        $scope.errorPay = false;
        $scope.approvalURL = false;
        $scope.paypalNetworkError = false;
        $scope.card.country = _.findWhere(tools.countries, {priority: 1});

        $scope.signup = {
            verificationSent: false,
            smsVerificationSent: false
        };

        $scope.generating = false;
        $scope.domains = [];

        // direct comes from the resolve in route, sometimes
        if (direct) {
            // determine what activation methods to show
            if (direct.VerifyMethods) {
                if (direct.VerifyMethods.indexOf('email') !== -1) {
                    $scope.showEmail = true;
                }
                if (direct.VerifyMethods.indexOf('recaptcha') !== -1) {
                    $scope.showCaptcha = true;
                }
                if (direct.VerifyMethods.indexOf('sms') !== -1) {
                    $scope.showSms = true;
                }
            }
        }

        if (plans.length > 0) {
            $scope.plan = _.findWhere(plans, {Name: $stateParams.plan, Cycle: parseInt($stateParams.billing), Currency: $stateParams.currency});
            $scope.paypalSupport = parseInt($stateParams.billing) === 12 && ($.browser.msie !== true || $.browser.edge === true);  // IE11 doesn't support PayPal
        }

        // Populate the domains <select>
        _.each(domains, function(domain) {
            $scope.domains.push({label: domain, value: domain});
        });

        $scope.maxPW = CONSTANTS.LOGIN_PW_MAX_LEN;

        $scope.account = {};

        // Select the first domain
        $scope.account.domain = $scope.domains[0];

        // Initialize verification code
        $scope.account.codeVerification = '';

        // Initialize captcha token
        $scope.account.captcha_token = false;

        // Initialize sms verification code
        $scope.account.smsCodeVerification = '';

        // Prepoppulate the username if from an invite link and mark as read only
        if (angular.isDefined($rootScope.username)) {
            $scope.account.Username = $rootScope.username;
            $scope.readOnlyUsername = true;
        } else {
            $scope.readOnlyUsername = false;
        }

        $scope.URLparams = $location.search();
        if ($scope.URLparams.u !== undefined) {
            $scope.account.Username = $scope.URLparams.u;
            $timeout(function() {
                $scope.checkAvailability(true);
            }, 200);
        }

        // FIX ME - Bart. Jan 18, 2016. Mon 2:29 PM.
        var captchaReceiveMessage = function(event) {
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
        };

        // Captcha
        window.addEventListener("message", captchaReceiveMessage, false);

        // Change this to our recaptcha key, configurable in Angular?
        var message = {
            "type": "pm_captcha",
            "language": "en",
            "key": "6LcWsBUTAAAAAOkRfBk-EXkGzOfcSz3CzvYbxfTn",
        };

        // Change window.location.origin to wherever this is hosted ( 'https://secure.protonmail.com:443' )
        window.captchaSendMessage = function() {
            var iframe = document.getElementById('pm_captcha');
            iframe.contentWindow.postMessage(message, 'https://secure.protonmail.com');
        };

    };

    $scope.setIframeSrc = function() {
        var iframe = document.getElementById('pm_captcha');
        iframe.onload = captchaSendMessage;
        iframe.src = "https://secure.protonmail.com/recaptcha.html";
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
        }).then(function(result) {
            if (result.data && result.data.Code === 1000) {
                $scope.signup.verificationSent = true;
            } else if (result.data && result.data.Error) {
                notify({message: result.data.Error, classes: 'notification-danger'});
            }
        });
    };

    $scope.sendSmsVerificationCode = function() {
        $scope.smsSending = true;
        User.code({
            Username: $scope.account.Username,
            Type: 'sms',
            Destination: {
                Phone: $scope.account.smsVerification
            }
        }).then(function(result) {
            $scope.smsSending = false;
            if (result.data && result.data.Code === 1000) {
                $scope.signup.smsVerificationSent = true;
            } else if (result.data && result.data.Error) {
                notify({message: result.data.Error, classes: 'notification-danger'});
            }
        });
    };

    // ---------------------------------------------------
    // ---------------------------------------------------
    // Creation Functions
    // ---------------------------------------------------
    // ---------------------------------------------------

    $scope.start = function() {
        $state.go('subscription');
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

            if (typeof msg !== 'string') {
                msg = gettextCatalog.getString('Something went wrong', null, 'Error');
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
            // custom validation
            if ($scope.account.loginPasswordConfirm !== $scope.account.loginPassword) {
                return;
            }

            $scope.filling = false;

            networkActivityTracker.track(
                $scope.checkAvailability(false)
                .then($scope.generateNewKeys)
                .then(function() {
                    $timeout(function() {
                        $scope.genNewKeys = false;

                        if ($rootScope.preInvited) {
                            $scope.createAccount();
                        } else if (plans.length > 0) {
                            $scope.payment = true;
                        } else {
                            $scope.humanityTest = true;
                        }
                    }, 2000);
                })
            );
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

    /**
     * @param {Boolean} manual - it means the fucntion was called outside of the automated chained functions. it will be set to true if triggered manually
     */
    $scope.checkAvailability = function(manual) {
        var deferred = $q.defer();

        // reset
        $scope.goodUsername = false;
        $scope.badUsername = false;
        $scope.badUsernameMessage = '';
        $scope.checkingUsername = true;

        // user came from pre-invite so we can not check if it exists
        if ($rootScope.allowedNewAccount === true && manual !== true) {
            $scope.checkingUsername = false;
            deferred.resolve(200);
        } else {
            if ($scope.account.Username) {
                var patt = new RegExp(/^[A-Za-z0-9]+(?:[_.-][A-Za-z0-9]+)*$/);

                if (patt.test($scope.account.Username)) {
                    User.available($scope.account.Username)
                    .then(function(result) {
                        if (result.data && result.data.Error) {
                            $scope.badUsername = true;
                            $scope.checkingUsername = false;
                            $scope.badUsernameMessage = result.data.Error;
                            $('#Username').focus();
                            deferred.reject(result.data.Error);
                        } else if (result.data && result.data.Code === 1000) {
                            if (result.data.Available === 0) {
                                if (manual === true) {
                                    $scope.badUsername = true;
                                    $scope.badUsernameMessage = gettextCatalog.getString('Username already taken', null, 'Error');
                                    $scope.checkingUsername = false;
                                    $('#Username').focus();
                                    deferred.resolve(200);
                                } else {
                                    $('#Username').focus();
                                    deferred.reject(gettextCatalog.getString('Username already taken', null, 'Error'));
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
                        }
                    });
                } else {
                    $scope.badUsername = true;
                    $scope.checkingUsername = false;
                    $scope.badUsernameMessage = gettextCatalog.getString('Username invalid', null, 'Error');
                    $('#Username').focus();
                    deferred.resolve(200);
                }
            } else {
                $scope.checkingUsername = false;
                deferred.resolve(200);
            }
        }

        return deferred.promise;
    };

    $scope.generateNewKeys = function() {
        var mbpw;

        $scope.genNewKeys = true;

        if ($scope.account.mailboxPasswordConfirm!==undefined) {
            mbpw = $scope.account.mailboxPasswordConfirm;
        } else if ($scope.account.mailboxPassword!==undefined) {
            mbpw = $scope.account.mailboxPassword;
        }

        return $scope.generateKeys('<' + $scope.account.Username + '@' + $scope.account.domain.value + '>', mbpw);
    };

    $scope.changeChoice = function(method) {
        if (method === 'paypal' && $scope.approvalURL === false) {
            $scope.initPaypal();
        }
    };

    $scope.initPaypal = function() {
        $scope.paypalNetworkError = false;

        Payment.paypal({
            Amount : $scope.plan.Amount,
            Currency : $scope.plan.Currency
        }).then(function(result) {
            if (result.data && result.data.Code === 1000) {
                if (result.data.ApprovalURL) {
                    $scope.approvalURL = result.data.ApprovalURL;
                }
            } else if (result.data.Code === 22802) {
                $scope.paypalNetworkError = true;
            } else if (result.data && result.data.Error){
                notify({message: result.data.Error, classes: 'notification-danger'});
            }
        });
    };

    function verify(method) {
        $scope.errorPay = false;

        networkActivityTracker.track(
            Payment.verify({
                Username: $scope.account.Username,
                Amount: $scope.plan.Amount,
                Currency: $scope.plan.Currency,
                Payment: method
            })
            .then(function(result) {
                if (result.data && result.data.Code === 1000) {
                    $scope.verifyCode = result.data.VerifyCode;
                    $scope.payment = false;
                    $rootScope.tempPlan = $scope.plan; // We need to subcribe this user later
                    $rootScope.tempMethod = method; // We save this payment method to save it later
                    $scope.createAccount();
                } else if (result.data && result.data.Error) {
                    notify({message: result.data.Error, classes: 'notification-danger'}); // We were unable to successfully charge your card. Please try a different card or contact your bank for assistance.
                    $scope.errorPay = true;
                } else {
                    $scope.errorPay = true;
                }
            })
        );
    }

    function receivePaypalMessage() {
        var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.

        if (origin !== 'https://secure.protonmail.com') {
            return;
        }

        var paypalObject = event.data;

        // we need to capitalize some stuff
        if (paypalObject.payerID && paypalObject.paymentID) {
            paypalObject.PayerID = paypalObject.payerID;
            paypalObject.PaymentID = paypalObject.paymentID;

            // delete unused
            delete paypalObject.payerID;
            delete paypalObject.paymentID;
        }

        var method = {Type: 'paypal', Details: paypalObject};

        verify(method);
        childWindow.close();
        window.removeEventListener('message', receivePaypalMessage, false);
    }

    $scope.openPaypalTab = function() {
        childWindow = window.open($scope.approvalURL, 'PayPal');
        window.addEventListener('message', receivePaypalMessage, false);
    };

    $scope.pay = function() {
        var year = ($scope.card.year.length === 2) ? '20' + $scope.card.year : $scope.card.year;
        var method = {
            Type: 'card',
            Details: {
                Number: $scope.card.number,
                ExpMonth: $scope.card.month,
                ExpYear: year,
                CVC: $scope.card.cvc,
                Name: $scope.card.fullname,
                Country: $scope.card.country.value,
                ZIP: $scope.card.zip
            }
        };

        verify(method);
    };

    $scope.doCreateUser = function() {
        var deferred = $q.defer();
        var params = {
            Username: $scope.account.Username,
            Password: $scope.account.loginPassword,
            Domain: $scope.account.domain.value,
            Email: $scope.account.notificationEmail,
            News: !!($scope.account.optIn),
            PrivateKey: $scope.account.PrivateKey
        };

        if (angular.isDefined($rootScope.inviteToken)) {
            params.Token = $rootScope.inviteToken;
            params.TokenType = 'invite';
        } else if (angular.isDefined($scope.account.captcha_token) && $scope.account.captcha_token !== false) {
            params.Token = $scope.account.captcha_token;
            params.TokenType = 'recaptcha';
        } else if ($scope.verifyCode) {
            params.Token = $scope.verifyCode;
            params.TokenType = 'payment';
        } else if ($scope.signup.smsVerificationSent !== false) {
            params.Token = $scope.account.smsCodeVerification;
            params.TokenType = 'sms';
        } else if ($scope.signup.verificationSent !== false) {
            params.Token = $scope.account.codeVerification;
            params.TokenType = 'email';
        }

        if ($rootScope.tempUser === undefined) {
            $rootScope.tempUser = [];
        }

        $rootScope.tempUser.username = $scope.account.Username;
        $rootScope.tempUser.password = $scope.account.loginPassword;

        User.create(params).then(function(result) {
            if (result.data && result.data.Code === 1000) {
                $scope.createUser  = true;
                deferred.resolve(result.data);
            } else if (result.data && result.data.Error) {
                deferred.reject(result.data.Error);
            } else {
                deferred.reject('Something went wrong');
            }
        });

        return deferred.promise;
    };

    $scope.doLogUserIn = function(response) {
        if (response.Code && response.Code===1000) {
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
                        $rootScope.isLoggedIn = authentication.isLoggedIn();
                        $rootScope.isLocked = authentication.isLocked();
                        $rootScope.isSecure = authentication.isSecured();
                        secureSessionStorage.setItem(CONSTANTS.MAILBOX_PASSWORD_KEY, pmcw.encode_utf8_base64($scope.account.mailboxPassword));
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
        $scope.finishCreation = true;

        if (CONSTANTS.WIZARD_ENABLED === true) {
            $rootScope.welcome = true; // Display welcome modal
        }

        if (authentication.user.Delinquent < 3) {
            $state.go('secured.inbox');
        } else {
            $state.go('secured.dashboard');
        }
    };

    $scope.initialization();

});
