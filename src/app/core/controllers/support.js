/* @ngInject */
function SupportController(
    AppModel,
    $scope,
    $state,
    $log,
    authentication,
    tempStorage,
    tools,
    gettextCatalog,
    confirmModal,
    Reset,
    setupKeys,
    networkActivityTracker
) {
    function resetState() {
        $scope.params.resetToken = '';
        $scope.params.danger = '';
        $scope.params.password = '';
        $scope.params.passwordConfirm = '';

        $scope.resetState = $scope.states.RECOVERY;
    }

    $scope.states = {
        RECOVERY: 1,
        CODE: 2,
        CHECKING: 3,
        DANGER: 4,
        PASSWORD: 5,
        GENERATE: 6,
        INSTALL: 7
    };

    $scope.tools = tools;
    $scope.params = {};
    $scope.params.recoveryEmail = '';
    $scope.params.username = '';
    $scope.passwordMode = 0;

    resetState();

    // Installing
    $scope.resetAccount = false;
    $scope.logUserIn = false;
    $scope.finishInstall = false;

    $scope.confirmResetLostPassword = () => {
        const title = gettextCatalog.getString('Confirm Reset Password', null, 'Title');
        const message = gettextCatalog.getString(
            'Resetting your password means you will no longer be able to read your old emails. <a href="https://protonmail.com/support/knowledge-base/updating-your-login-password/" target="_blank">Click here to learn more</a>. If you have further questions, please email contact@protonmail.ch. Are you sure you want to reset your password?',
            null,
            'Title'
        );
        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    confirmModal.deactivate();
                    resetLostPassword();
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Request a token to reset login pass. Some validation first.
     * Shows errors otherwise sets a flag to show a different form
     */
    function resetLostPassword() {
        const promise = Reset.requestResetToken({
            Username: $scope.params.username,
            NotificationEmail: $scope.params.recoveryEmail
        }).then(() => {
            $scope.resetState = $scope.states.CODE;
        });

        networkActivityTracker.track(promise);
    }

    /**
     * Validates the token and shows the last form
     * @param form {Form}
     */
    $scope.validateToken = () => {
        $scope.resetState = $scope.states.CHECKING;

        $scope.tokenParams = {
            Username: $scope.params.username,
            Token: $scope.params.resetToken
        };

        const promise = Reset.validateResetToken($scope.tokenParams)
            .then(({ data = {} }) => {
                $scope.passwordMode = data.PasswordMode;
                $scope.addresses = data.Addresses;

                $scope.resetState = $scope.states.DANGER;
            })
            .catch((error) => {
                resetState();
                $log.error(error);
                throw error;
            });

        networkActivityTracker.track(promise);
    };

    $scope.confirmReset = () => {
        $scope.resetState = $scope.states.PASSWORD;
    };

    $scope.goToCode = () => {
        $scope.resetState = $scope.states.CODE;
        $scope.showTokenUsername = true;
    };

    function doReset() {
        return generateKeys().then(installKeys);
    }

    function generateKeys() {
        $log.debug('generateKeys');
        $scope.resetState = $scope.states.GENERATE;

        return setupKeys.generate($scope.addresses, $scope.params.password);
    }

    function installKeys(data = {}) {
        $log.debug('installKeys');
        $scope.resetState = $scope.states.INSTALL;
        $scope.resetAccount = true;

        return setupKeys.reset(data, $scope.params.password, $scope.tokenParams);
    }

    function doLogUserIn() {
        $scope.logUserIn = true;
        return authentication
            .loginWithCredentials({
                Username: $scope.params.username,
                Password: $scope.params.password
            })
            .then(({ data }) => {
                AppModel.set('isLoggedIn', true);
                return data;
            });
    }

    function finishRedirect(authResponse) {
        $log.debug('finishRedirect');
        $scope.finishInstall = true;
        const creds = {
            username: $scope.params.username,
            password: $scope.params.password,
            authResponse
        };
        tempStorage.setItem('creds', creds);
        $state.go('login.unlock');
    }

    /**
     * Saves new login pass. Shows success page.
     * @param form {Form}
     */
    $scope.resetPassword = () => {
        networkActivityTracker.track(
            doReset()
                .then(doLogUserIn)
                .then(finishRedirect)
                .catch((error) => {
                    $log.error(error);
                    resetState();
                    throw error;
                })
        );
    };

    // Can't user $stateParams because support is a single controller
    // This should be refactored into the support message controller and the reset controller
    // after mailbox password reset is fully deprecated
    if ($state.is('support.reset-password') && $state.params.username && $state.params.token) {
        $scope.resetState = $scope.states.CHECKING;

        $scope.params.username = $state.params.username;
        $scope.params.resetToken = $state.params.token;

        $scope.validateToken();
    }
}
export default SupportController;
