import { hasSessionStorage, hasCookie } from '../../../helpers/browser';

/* @ngInject */
function LoginController(
    $rootScope,
    $state,
    $stateParams,
    $scope,
    $log,
    $timeout,
    $http,
    $location,
    CONFIG,
    dispatchers,
    gettextCatalog,
    authentication,
    networkActivityTracker,
    notify,
    helpLoginModal,
    AppModel,
    pmcw,
    tempStorage,
    srp
) {
    const { on, unsubscribe } = dispatchers();
    $scope.twoFactor = 0;
    $scope.showOld = window.location.hostname !== 'old.protonmail.com';
    $scope.domoArigato = true;

    on('AppModel', (event, { type, data }) => {
        switch (type) {
            case 'domoArigato':
                $scope.domoArigato = data.value;
                break;
        }
    });

    $scope.$on('$destroy', unsubscribe);

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
        $timeout(() => $('#username').focus(), 30, false);
    }

    /**
     * Focus the password field
     */
    function selectPassword() {
        const input = document.getElementById('password');
        input.focus();
        input.select();
    }

    function selectTwoFactor() {
        const input = document.getElementById('twoFactorCode');
        input.focus();
        input.select();
    }

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
        if (hasSessionStorage() === false) {
            notify({
                message: gettextCatalog.getString(
                    'You are in Private Mode or have Session Storage disabled.\nPlease deactivate Private Mode and then reload the page.\n<a href="https://protonmail.com/support/knowledge-base/enabling-cookies/" target="_blank">More information here</a>.',
                    null,
                    'Error'
                ),
                classes: 'notification-danger',
                duration: '0'
            });
        }
    }

    /**
     * Detect if the current browser have cookie enable
     * or notify the user
     */
    function testCookie() {
        //
        if (hasCookie() === false) {
            notify({
                message: gettextCatalog.getString(
                    'Cookies are disabled.\nPlease activate it and then reload the page.\n<a href="https://protonmail.com/support/knowledge-base/enabling-cookies/" target="_blank">More information here</a>.',
                    null,
                    'Error'
                ),
                classes: 'notification-danger',
                duration: '0'
            });
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
                return unlock($scope.creds.password, $scope.creds.authResponse);
            }

            AppModel.set('domoArigato', false);
        } else if ($state.is('login.sub')) {
            const url = window.location.href;
            const arr = url.split('/');
            const domain = arr[0] + '//' + arr[2];
            const login = (event) => {
                if (event.origin !== domain) {
                    return;
                }

                // Parse the event data.
                const { data = {} } = event;
                const { UID, MailboxPassword } = data;

                // Ensure this messages contains UID, otherwise it could be a message coming from somewhere else.
                if (!UID) {
                    return;
                }

                // Remove listener
                window.removeEventListener('message', login);

                // Save password
                authentication.savePassword(MailboxPassword);

                // Continues loading up the app
                authentication.saveAuthData({ UID });

                $rootScope.isSecure = true;
                $rootScope.isLoggedIn = true;

                // Redirect to inbox
                $state.go('secured.inbox');
            };

            window.addEventListener('message', login);
            window.opener.postMessage('ready', domain);
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
     * Function called at the initialization of this controller
     */
    function initialization() {
        AppModel.set('domoArigato', true);
        setLoggedIn();
        focusInput();
        checkHelpTag();
        testSessionStorage();
        testCookie();
        autoLogin();
    }

    function resetLoginInputs() {
        $scope.password = '';
        $scope.twoFactorCode = '';
    }

    function login(username, password, twoFactorCode, initialInfoResponse) {
        networkActivityTracker.track(
            authentication
                .loginWithCredentials(
                    {
                        Username: username,
                        Password: password,
                        TwoFactorCode: twoFactorCode
                    },
                    initialInfoResponse
                )
                .then(
                    (result) => {
                        $log.debug('loginWithCredentials:result.data ', result);
                        if (
                            angular.isDefined(result.data) &&
                            angular.isDefined(result.data.Code) &&
                            result.data.Code === 401
                        ) {
                            selectPassword();
                            notify({ message: result.data.Error, classes: 'notification-danger' });
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
                                UID: result.data.Uid,
                                ExpiresIn: result.data.ExpiresIn,
                                EventID: result.data.EventID
                            });
                            authentication
                                .setAuthCookie(result.data)
                                .then(() => {
                                    $rootScope.isLoggedIn = true;

                                    $state.go('login.setup');
                                })
                                .catch((error) => {
                                    notify({ message: error.message, classes: 'notification-danger' });
                                    $state.go('login');
                                });
                        } else if (result.data && result.data.AccessToken) {
                            $rootScope.isLoggedIn = true;
                            const creds = {
                                username,
                                password,
                                authResponse: result.data
                            };

                            if (result.data.PasswordMode === 1) {
                                AppModel.set('domoArigato', true);
                            }
                            tempStorage.setItem('creds', creds);
                            $state.go('login.unlock');
                        } else if (result.data && result.data.Code === 5003) {
                            // Nothing
                        } else if (result.data && result.data.Error) {
                            notify({ message: result.data.Error, classes: 'notification-danger' });
                            resetLoginInputs();
                        } else {
                            notify({ message: 'Unable to log you in.', classes: 'notification-danger' });
                            resetLoginInputs();
                        }
                    },
                    (result) => {
                        if (result.message === undefined) {
                            result.message = 'Sorry, our login server is down. Please try again later.';
                        }
                        $scope.twoFactor = 0;
                        $timeout(selectPassword, 100, false);
                        notify({ message: result.message, classes: 'notification-danger' });
                        console.error(result);
                        resetLoginInputs();
                    }
                )
        );
    }

    function unlock(mailboxPassword = '', authResponse = {}) {
        return authentication
            .unlockWithPassword(mailboxPassword, authResponse)
            .then((resp) => {
                $log.debug('unlockWithPassword:resp' + resp);
                return authentication.setAuthCookie(authResponse).then((resp) => {
                    $log.debug('setAuthCookie:resp' + resp);
                    $rootScope.isLoggedIn = authentication.isLoggedIn();
                    $rootScope.isLocked = authentication.isLocked();
                    $rootScope.isSecure = authentication.isSecured();

                    $state.go('secured.inbox');
                });
            })
            .catch((error) => {
                $log.error('login.unlock', error);

                // clear password for user
                selectPassword();

                notify({ message: error.message, classes: 'notification-danger' });
            });
    }

    /**
     * Open login modal to help the user
     */
    $scope.displayHelpModal = () => {
        helpLoginModal.activate({
            params: {
                close() {
                    helpLoginModal.deactivate();
                }
            }
        });
    };

    $scope.enterLoginPassword = (e) => {
        e.preventDefault();

        angular.element('input').blur();
        angular.element('#pm_login').attr({ action: '/*' });
        clearErrors();

        const { username = '', password = '' } = $scope;

        try {
            if (!username || !password) {
                throw new Error(
                    gettextCatalog.getString('Please enter your username and password', null, 'Login error')
                );
            }

            const usernameLowerCase = username.toLowerCase();
            const passwordEncoded = pmcw.encode_utf8(password);

            if (!passwordEncoded) {
                throw new Error(gettextCatalog.getString('Your password is missing', null, 'Login error'));
            }

            networkActivityTracker.track(
                srp.info(usernameLowerCase).then(
                    (resp) => {
                        $scope.initialInfoResponse = resp;
                        if (resp.data.TwoFactor === 0) {
                            // user does not have two factor enabled, we will proceed to the auth call
                            login(usernameLowerCase, password, null, $scope.initialInfoResponse);
                        } else {
                            // user has two factor enabled, they need to enter a code first
                            $scope.twoFactor = 1;
                            $timeout(selectTwoFactor, 100, false);
                        }
                    },
                    (error) => {
                        return Promise.reject(error);
                    }
                )
            );
        } catch (error) {
            const { message } = error;
            notify({ message, classes: 'notification-danger' });
        }
    };

    $scope.enterTwoFactor = (e) => {
        e.preventDefault();

        if (angular.isUndefined($scope.twoFactorCode) || $scope.twoFactorCode.length === 0) {
            notify({
                message: gettextCatalog.getString('Please enter your two-factor passcode', null, 'Error'),
                classes: 'notification-danger'
            });
            return;
        }
        login($scope.username, $scope.password, $scope.twoFactorCode, $scope.initialInfoResponse);
    };

    $scope.unlock = (e) => {
        e.preventDefault();
        // Blur unlock password field
        angular.element('[type=password]').blur();
        // Make local so extensions (or Angular) can't mess with it by clearing the form too early
        const mailboxPassword = $scope.mailboxPassword;

        clearErrors();

        networkActivityTracker.track(unlock(mailboxPassword, $scope.creds.authResponse));
    };

    $scope.reset = () => {
        $rootScope.isLoggedIn = false;
        $state.go('support.reset-password');
    };

    initialization();
}
export default LoginController;
