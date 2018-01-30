/* @ngInject */
function handle403($http, $q, loginPasswordModal, User, authentication, networkActivityTracker) {
    return (config) => {
        const deferred = $q.defer();
        // Open the open to enter login password because this request require lock scope
        loginPasswordModal.activate({
            params: {
                submit(Password, TwoFactorCode) {
                    // Send request to unlock the current session for administrator privileges
                    const promise = User.unlock({ Password, TwoFactorCode })
                        .then(() => {
                            loginPasswordModal.deactivate();
                            // Resend request now
                            deferred.resolve($http(config));
                        });

                    networkActivityTracker.track(promise);
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
}
export default handle403;
