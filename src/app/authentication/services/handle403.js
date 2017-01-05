angular.module('proton.authentication')
.factory('handle403', ($http, $q, loginPasswordModal, User, authentication, notify) => {
    return (config) => {
        const deferred = $q.defer();
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
                        deferred.resolve($http(config));
                    }, (error) => {
                        notify({ message: error.error_description, classes: 'notification-danger' });
                    });
                },
                cancel() {
                    loginPasswordModal.deactivate();
                    deferred.reject();
                }
            }
        });
        return deferred.promise;
    };
});
