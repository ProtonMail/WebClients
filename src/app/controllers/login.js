angular.module('proton.controllers.Auth', [
    'proton.authentication',
    'proton.pmcw',
    'proton.constants',
    'proton.models.setting',
    'proton.srp',
    'proton.tempStorage'
])

.controller('LoginController', (
    $rootScope,
    $state,
    $stateParams,
    $scope,
    $log,
    $timeout,
    $http,
    $location,
    CONSTANTS,
    CONFIG,
    gettextCatalog,
    authentication,
    networkActivityTracker,
    notify,
    loginModal,
    pmcw,
    tempStorage,
    tools,
    Setting,
    srp) => {
    $rootScope.pageName = 'Login';
    $scope.maxPW = CONSTANTS.LOGIN_PW_MAX_LEN;
    $scope.twoFactor = 0;


    // FIXME: this part seems useless or bad coded
    // if ($rootScope.isLoggedIn && $rootScope.isLocked === false && $rootScope.user === undefined) {
    //     try {
    //         $rootScope.user = authentication.fetchUserInfo();
    //     }
    //     catch(err) {
    //         $log.error('appjs',err);
    //         alert(err);
    //     }
    // }

    /**
     * Clean notifications
     */
    function clearErrors() {
        $scope.error = null;
        notify.closeAll();
    }

    /**
     * Set $rootScope.isLoggedIn
     * Needed to handle back button from unlock state
     */
    function setLoggedIn() {
        $rootScope.isLoggedIn = !$state.is('login');
    }

    /**
     * Focus specific input element
     */
    function focusInput() {
        $timeout(() => { $('input.focus').focus(); });
    }

    /**
     * Focus the password field
     */
    function selectPassword() {
        const input = angular.element('#password');
        input.focus();
        input.select();
    }

    const selectTwoFactor = function () {
        const input = angular.element('#twoFactorCode');
        input.focus();
        input.select();
    };

    /**
    * Detect the #help parameter inside the URL and display the help modal
    */
    function checkHelpTag() {
        if ($location.hash() === 'help') {
            $scope.displayHelpModal();
        }
    }

    /**
     * Detect if the current browser have session storage enable
     * or notify the user
     */
    function testSessionStorage() {
        if (tools.hasSessionStorage() === false) {
            notify({ message: gettextCatalog.getString('You are in Private Mode or have Session Storage disabled.\nPlease deactivate Private Mode and then reload the page.\n<a href="https://protonmail.com/support/knowledge-base/enabling-cookies/" target="_blank">More information here</a>.', null, 'Error'), classes: 'notification-danger', duration: '0' });
        }
    }

    /**
     * Detect if the current browser have cookie enable
     * or notify the user
     */
    function testCookie() {
        //
        if (tools.hasCookie() === false) {
            notify({ message: gettextCatalog.getString('Cookies are disabled.\nPlease activate it and then reload the page.\n<a href="https://protonmail.com/support/knowledge-base/enabling-cookies/" target="_blank">More information here</a>.', null, 'Error'), classes: 'notification-danger', duration: '0' });
        }
    }

    function autoLogin() {

        $scope.creds = tempStorage.getItem('creds');

        if ($state.is('login.unlock')) {

            if (!$scope.creds) {
                return $state.go('login');
            }

            if (!$scope.creds.authResponse) {
                tempStorage.setItem('creds', $scope.creds);
                return $state.go('login');
            }

            if ($scope.creds.authResponse.PasswordMode === 1) {
                $rootScope.domoArigato = true;
                return unlock($scope.creds.password, $scope.creds.authResponse);
            }
        } else {
            if (!$scope.creds || !$scope.creds.username || !$scope.creds.password) {
                delete $scope.creds;
                return;
            }

            srp
                .info($scope.creds.username)
                .then((resp) => {
                    if (resp.data.TwoFactor === 0) {
                        // user does not have two factor enabled, we will proceed to the auth call
                        login($scope.creds.username, $scope.creds.password, null, resp);
                    } else {
                        // user has two factor enabled, they need to enter a code first
                        $scope.twoFactor = 1;
                        $scope.initialInfoResponse = resp;
                        $timeout(selectTwoFactor, 100, false);
                    }
                })
                .catch((error) => {
                    console.log(error);
                });
        }
    }
    /**
     * Detect the sub parameter to initialize the sub account session
     */
    function manageSubAccount() {
        if ($stateParams.sub) {
            const url = window.location.href;
            const arr = url.split('/');
            const domain = arr[0] + '//' + arr[2];
            const login = (event) => {
                if (event.origin !== domain) { return; }
                const sessionToken = event.data.SessionToken;
                const adminPassword = event.data.MailboxPassword;

                // Save password FIXME
                authentication.savePassword(adminPassword);

                // Continues loading up the app
                authentication.saveAuthData({ SessionToken: sessionToken });

                // Remove listener
                window.removeEventListener('message', this);
                $rootScope.isSecure = true;
                $rootScope.isLoggedIn = true;

                // Redirect to inbox
                $state.go('secured.inbox');
            };

            window.addEventListener('message', login);
            window.opener.postMessage('ready', domain);
        }
    }

    /**
     * Function called at the initialization of this controller
     */
    function initialization() {
        setLoggedIn();
        focusInput();
        checkHelpTag();
        testSessionStorage();
        testCookie();
        manageSubAccount();
        autoLogin();
    }

    function login(username, password, twoFactorCode, initialInfoResponse) {

        networkActivityTracker.track(
            authentication.loginWithCredentials({
                Username: username,
                Password: password,
                TwoFactorCode: twoFactorCode
            }, initialInfoResponse)
            .then(
                (result) => {
                    $log.debug('loginWithCredentials:result.data ', result);
                    if (angular.isDefined(result.data) && angular.isDefined(result.data.Code) && result.data.Code === 401) {

                        selectPassword();
                        notify({ message: result.data.ErrorDescription, classes: 'notification-danger' });
                    } else if (result.data && result.data.Code === 10002) {
                        let message;

                        if (result.data.Error) {
                            message = result.data.Error;
                        } else {
                            message = 'Your account has been disabled.';
                        }
                        // This account is disabled.
                        notify({ message, classes: 'notification-danger' });
                    } else if (result.data && typeof result.data.PrivateKey === 'undefined') {
                        authentication.receivedCredentials({
                            AccessToken: result.data.AccessToken,
                            RefreshToken: result.data.RefreshToken,
                            Uid: result.data.Uid,
                            ExpiresIn: result.data.ExpiresIn,
                            EventID: result.data.EventID
                        });
                        authentication.setAuthCookie(result.data)
                        .then(() => {
                            $rootScope.isLoggedIn = true;

                            $state.go('login.setup');
                        })
                        .catch((error) => {
                            authentication.logout(true);
                            notify({ message: error.message, classes: 'notification-danger' });
                        });
                    } else if (result.data && result.data.AccessToken) {

                        $rootScope.isLoggedIn = true;
                        const creds = {
                            username,
                            password,
                            authResponse: result.data
                        };

                        if (result.data.PasswordMode === 1) {
                            $rootScope.domoArigato = true;
                        }
                        tempStorage.setItem('creds', creds);
                        $state.go('login.unlock');
                    } else if (result.data && result.data.Code === 5003) {
                        // Nothing
                    } else if (result.data && result.data.Error) {

                        // TODO: This might be buggy
                        const error = (angular.isDefined(result.data.ErrorDescription) && result.data.ErrorDescription.length) ? result.data.ErrorDescription : result.data.Error;

                        notify({ message: error, classes: 'notification-danger' });
                    } else {
                        notify({ message: 'Unable to log you in.', classes: 'notification-danger' });
                    }
                },
                (result) => {
                    if (result.message === undefined) {
                        result.message = 'Sorry, our login server is down. Please try again later.';
                    }
                    $scope.twoFactor = 0;
                    $timeout(selectPassword, 100, false);
                    notify({ message: result.message, classes: 'notification-danger' });
                }
            )
        );
    }

    function unlock(mailboxPassword = '', authResponse = {}) {
        return authentication.unlockWithPassword(
            mailboxPassword,
            authResponse
        )
        .then((resp) => {
            $log.debug('unlockWithPassword:resp' + resp);
            return authentication.setAuthCookie(authResponse)
            .then((resp) => {
                $log.debug('setAuthCookie:resp' + resp);
                $rootScope.isLoggedIn = authentication.isLoggedIn();
                $rootScope.isLocked = authentication.isLocked();
                $rootScope.isSecure = authentication.isSecured();

                $state.go('secured.inbox');
            });
        })
        .catch((error) => {
            $log.error('unlock', error);

            // clear password for user
            selectPassword();

            notify({ message: error.message, classes: 'notification-danger' });
        });
    }

    /**
     * Open login modal to help the user
     */
    $scope.displayHelpModal = function () {
        loginModal.activate({
            params: {
                cancel() {
                    loginModal.deactivate();
                }
            }
        });
    };

    $scope.enterLoginPassword = function () {
        angular.element('input').blur();
        angular.element('#pm_login').attr({ action: '/*' });
        clearErrors();

        const username = $scope.username.toLowerCase();
        const password = $scope.password; // Login password

        // Check username and password
        if (!username || !password) {
            notify({ message: gettextCatalog.getString('Please enter your username and password', null, 'Error'), classes: 'notification-danger' });
            return;
        }

        // Custom validation
        try {
            if (pmcw.encode_utf8(password).length > CONSTANTS.LOGIN_PW_MAX_LEN) {
                notify({ message: gettextCatalog.getString('Passwords are limited to ' + CONSTANTS.LOGIN_PW_MAX_LEN + ' characters', null, 'Error'), classes: 'notification-danger' });
                return;
            }
        } catch (err) {
            notify({ message: err.message, classes: 'notification-danger' });
            return;
        }

        srp
            .info($scope.username)
            .then((resp) => {
                $scope.initialInfoResponse = resp;
                if (resp.data.TwoFactor === 0) {
                    // user does not have two factor enabled, we will proceed to the auth call
                    login($scope.username, $scope.password, null, $scope.initialInfoResponse);
                } else {
                    // user has two factor enabled, they need to enter a code first
                    $scope.twoFactor = 1;
                    $timeout(selectTwoFactor, 100, false);
                }
            }, (error) => {
                console.log(error);
            });
    };

    $scope.enterTwoFactor = function () {
        if (angular.isUndefined($scope.twoFactorCode) || $scope.twoFactorCode.length === 0) {
            notify({ message: gettextCatalog.getString('Please enter your two-factor passcode', null, 'Error'), classes: 'notification-danger' });
            return;
        }
        login($scope.username, $scope.password, $scope.twoFactorCode, $scope.initialInfoResponse);
    };

    $scope.unlock = function () {
        // Blur unlock password field
        angular.element('[type=password]').blur();
        // Make local so extensions (or Angular) can't mess with it by clearing the form too early
        const mailboxPassword = $scope.mailboxPassword;

        clearErrors();

        networkActivityTracker.track(unlock(mailboxPassword, $scope.creds.authResponse));
    };

    $scope.reset = function () {
        if (CONSTANTS.KEY_PHASE > 2) {
            $rootScope.isLoggedIn = false;
            $state.go('support.reset-password');
        } else {
            tempStorage.setItem('creds', $scope.creds);
            $state.go('reset');
        }
    };

    initialization();
});
