/* @ngInject */
function askPassword(loginPasswordModal) {
    /**
     * Open the password modal to unlock the next process
     * @param {Boolean} showTwoFactor
     * @return {Promise}
     */
    return (showTwoFactor) =>
        new Promise((resolve, reject) => {
            loginPasswordModal.activate({
                params: {
                    hasTwoFactor: showTwoFactor,
                    submit(password, twoFactorCode) {
                        loginPasswordModal.deactivate();
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
