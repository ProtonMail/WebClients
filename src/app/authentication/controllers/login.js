import { hasSessionStorage, hasCookie } from '../../../helpers/browser';

/* @ngInject */
function LoginController(
    $state,
    $scope,
    $log,
    $timeout,
    $location,
    CONFIG,
    dispatchers,
    gettextCatalog,
    authentication,
    networkActivityTracker,
    notification,
    helpLoginModal,
    AppModel,
    pmcw,
    tempStorage,
    srp
) {
    /**
     * NOTE: THIS FILE AND THE SRP NEEDS TO BE REFACTORED TO PROPERLY HANDLE ERRORS.
     * MADE A BEST EFFORT TO ONLY SHOW ERRORS ONCE BUT I MAY SHOW TWICE.
     */
    const I18N = {
        NO_DATA_ERROR: gettextCatalog.getString('Unable to log you in. Please try again later.', null, 'Error'),
        SESSION_STORAGE_ERROR: gettextCatalog.getString(
            'You are in Private Mode or have Session Storage disabled.\nPlease deactivate Private Mode and then reload the page.\n<a href="https://protonmail.com/support/knowledge-base/enabling-cookies/" target="_blank">More information here</a>.',
            null,
            'Error'
        ),
        COOKIES_ERROR: gettextCatalog.getString(
            'Cookies are disabled.\nPlease activate it and then reload the page.\n<a href="https://protonmail.com/support/knowledge-base/enabling-cookies/" target="_blank">More information here</a>.',
            null,
            'Error'
        ),
        USERNAME_PASSWORD_ERROR: gettextCatalog.getString(
            'Please enter your username and password',
            null,
            'Login error'
        ),
        PASSWORD_ERROR: gettextCatalog.getString('Your password is missing', null, 'Login error'),
        TWOFA_ERROR: gettextCatalog.getString('Please enter your two-factor passcode', null, 'Error')
    };

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

    function notifyError(message, options) {
        return notification.error({
            message,
            ...options
        });
    }

    /**
     * Clean notifications
     */
    function clearErrors() {
        $scope.error = null;
        notification.closeAll();
    }

    /**
     * Needed to handle back button from unlock state
     */
    function setLoggedIn() {
        AppModel.set('isLoggedIn', !$state.is('login'));
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
        if (!hasSessionStorage()) {
            return notifyError(I18N.SESSION_STORAGE_ERROR, { duration: '0' });
        }
    }

    /**
     * Detect if the current browser have cookie enable
     * or notify the user
     */
    function testCookie() {
        if (!hasCookie()) {
            return notifyError(I18N.COOKIES_ERROR, { duration: '0' });
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
                return unlock($scope.creds.password, $scope.creds.authResponse).catch((e) => {
                    // If the network call fails here, we need to redirect back to the login screen. Otherwise it just shows a spinner.
                    $state.go('login');
                    // Temporary fix: Not using the network activity tracker here so manually showing the notification.
                    notifyError(e.data ? e.data.Error : e.message);
                });
            }

            return AppModel.set('domoArigato', false);
        }

        if ($state.is('login.sub')) {
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

                AppModel.set('isSecure', true);
                AppModel.set('isLoggedIn', true);

                // Redirect to inbox
                $state.go('secured.inbox');
            };

            window.addEventListener('message', login);
            window.opener.postMessage('ready', domain);
            return;
        }

        if (!$scope.creds || !$scope.creds.username || !$scope.creds.password) {
            delete $scope.creds;
            return;
        }

        return initialAuth($scope.creds.username, $scope.creds.password);
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
        const options = {
            Username: username,
            Password: password,
            TwoFactorCode: twoFactorCode
        };
        return authentication
            .loginWithCredentials(options, initialInfoResponse)
            .then((result) => {
                $log.debug('loginWithCredentials:result.data ', result);
                if (!result.data) {
                    throw new Error(I18N.NO_DATA_ERROR);
                }

                if (typeof result.data.PrivateKey === 'undefined') {
                    authentication.receivedCredentials({
                        AccessToken: result.data.AccessToken,
                        RefreshToken: result.data.RefreshToken,
                        UID: result.data.Uid,
                        ExpiresIn: result.data.ExpiresIn,
                        EventID: result.data.EventID
                    });
                    return authentication
                        .setAuthCookie(result.data)
                        .then(() => {
                            AppModel.set('isLoggedIn', true);

                            $state.go('login.setup');
                        })
                        .catch((error) => {
                            throw error;
                        });
                }

                if (result.data.AccessToken) {
                    AppModel.set('isLoggedIn', true);
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
                }
            })
            .catch((error) => {
                $state.go('login');
                $scope.twoFactor = 0;
                $timeout(selectPassword, 100, false);
                resetLoginInputs();
                throw error;
            });
    }

    function initialAuth(username, password) {
        return srp.info(username).then((resp) => {
            $scope.initialInfoResponse = resp;

            if (resp.data.TwoFactor === 0) {
                // user does not have two factor enabled, we will proceed to the auth call
                return login(username, password, null, $scope.initialInfoResponse);
            }

            // user has two factor enabled, they need to enter a code first
            $scope.twoFactor = 1;
            $timeout(selectTwoFactor, 100, false);
        });
    }

    function unlock(mailboxPassword = '', authResponse = {}) {
        return authentication
            .unlockWithPassword(mailboxPassword, authResponse)
            .then((resp) => {
                $log.debug('unlockWithPassword:resp' + resp);
                return authentication.setAuthCookie(authResponse).then((resp) => {
                    $log.debug('setAuthCookie:resp' + resp);
                    AppModel.set('isLoggedIn', authentication.isLoggedIn());
                    AppModel.set('isLocked', authentication.isLocked());
                    AppModel.set('isSecure', authentication.isSecured());

                    $state.go('secured.inbox');
                });
            })
            .catch((error) => {
                $log.error('login.unlock', error);

                // clear password for user
                selectPassword();

                throw error;
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

        if (!username || !password) {
            return notifyError(I18N.USERNAME_PASSWORD_ERROR);
        }

        const usernameLowerCase = username.toLowerCase();
        const passwordEncoded = pmcw.encode_utf8(password);

        if (!passwordEncoded) {
            return notifyError(I18N.PASSWORD_ERROR);
        }

        networkActivityTracker.track(initialAuth(usernameLowerCase, password));
    };

    $scope.enterTwoFactor = (e) => {
        e.preventDefault();

        if (angular.isUndefined($scope.twoFactorCode) || $scope.twoFactorCode.length === 0) {
            return notifyError(I18N.TWOFA_ERROR);
        }

        networkActivityTracker.track(
            login($scope.username, $scope.password, $scope.twoFactorCode, $scope.initialInfoResponse)
        );
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
        AppModel.set('isLoggedIn', false);
        $state.go('support.reset-password');
    };

    initialization();
}
export default LoginController;
