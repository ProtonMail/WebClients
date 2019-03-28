/* @ngInject */
function SupportController(
    AppModel,
    $scope,
    $state,
    $log,
    authentication,
    authApi,
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
            'Resetting your password means you will no longer be able to read your old emails. <a href="https://protonmail.com/support/knowledge-base/updating-your-login-password/" target="_blank">Click here to learn more</a>. If you have further questions, please email contact@protonmail.com. Are you sure you want to reset your password?',
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
        const promise = Reset.request({
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

        const promise = Reset.validate($scope.tokenParams)
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

    async function doReset() {
        const credentials = {
            username: $scope.params.username,
            password: $scope.params.password
        };

        $scope.$applyAsync(() => {
            $scope.resetState = $scope.states.GENERATE;
        });

        const { mailboxPassword, keySalt, keys } = await setupKeys.generate($scope.addresses, credentials.password);

        $scope.$applyAsync(() => {
            $scope.resetState = $scope.states.INSTALL;
            $scope.resetAccount = true;
        });

        await setupKeys.reset({ keySalt, keys }, credentials.password, $scope.tokenParams);

        $scope.$applyAsync(() => {
            $scope.logUserIn = true;
        });

        await authentication.loginWithCookies(credentials);

        authentication.setPassword(mailboxPassword);

        $scope.$applyAsync(() => {
            $scope.finishInstall = true;
        });

        return $state.go('secured.inbox');
    }

    /**
     * Saves new login pass. Shows success page.
     * @param form {Form}
     */
    $scope.resetPassword = () => {
        networkActivityTracker.track(
            doReset().catch((error) => {
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
