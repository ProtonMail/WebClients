/* @ngInject */
function askPassword(loginPasswordModal) {
    /**
     * Open the password modal to unlock the next process
     * @param  {submit} {Function}
     */
    return (cb = angular.noop) =>
        new Promise((resolve, reject) => {
            loginPasswordModal.activate({
                params: {
                    submit(password, twoFactorCode) {
                        loginPasswordModal.deactivate();
                        cb(password, twoFactorCode);
                        resolve({ password, twoFactorCode });
                    },
                    cancel() {
                        loginPasswordModal.deactivate();
                        const error = new Error('loginPassword:cancel');
                        error.noNotify = true;
                        reject(error);
                    }
                }
            });
        });
}

export default askPassword;
