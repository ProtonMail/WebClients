angular.module('proton.authentication')
.factory('handle403', ($http, $q, loginPasswordModal, User, authentication, notify) => {
    return (config) => {
        const deferred = $q.defer();
        // Open the open to enter login password because this request require lock scope
        loginPasswordModal.activate({
            params: {
                submit(Password, TwoFactorCode) {
                    // Send request to unlock the current session for administrator privileges
                    User.unlock({ Password, TwoFactorCode })
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

                    // usefull for networkManager tracker
                    deferred.reject(new Error('loginPassword:cancel'));
                }
            }
        });
        return deferred.promise;
    };
});
