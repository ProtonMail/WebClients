angular.module('proton.authentication')
.factory(($http, $rootScope, loginPasswordModal, User, authentication, notify) => {
    $rootScope.$on('handle403', (event, config) => {
        // Open the open to enter login password because this request require lock scope
        loginPasswordModal.activate({
            params: {
                hasTwoFactor: authentication.user.TwoFactor,
                submit(loginPassword, twoFactorCode) {
                    // Send request to unlock the current session for administrator privileges
                    User.unlock({ Password: loginPassword, TwoFactorCode: twoFactorCode })
                    .then(() => {
                        loginPasswordModal.deactivate();
                        // Resend request now
                        $http(config);
                    }, (error) => {
                        notify({ message: error.error_description, classes: 'notification-danger' });
                    });
                },
                cancel() {
                    loginPasswordModal.deactivate();
                }
            }
        });
    });

    function noop() {}

    return { noop };
});
