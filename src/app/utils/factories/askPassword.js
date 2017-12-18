/* @ngInject */
function askPassword(loginPasswordModal) {
    /**
     * Open the password modal to unlock the next process
     * @param  {submit} {Function}
     */
    return (cb = angular.noop) => {
        loginPasswordModal.activate({
            params: {
                submit(password, twoFactorCode) {
                    loginPasswordModal.deactivate();
                    cb(password, twoFactorCode);
                },
                cancel() {
                    loginPasswordModal.deactivate();
                }
            }
        });
    };
}

export default askPassword;
