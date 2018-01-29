/* @ngInject */
function loginPasswordModal($timeout, pmModal, srp, networkActivityTracker, userSettingsModel) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/authentication/modals/loginPassword.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.loginPassword = '';
            this.twoFactorCode = '';
            this.userPasswordMode = userSettingsModel.get('PasswordMode');
            this.submit = () => params.submit(this.loginPassword, this.twoFactorCode);
            this.cancel = () => params.cancel();

            if (params.hasTwoFactor) {
                this.hasTwoFactor = params.hasTwoFactor === 1;
            } else {
                const promise = srp.info().then(({ data = {} } = {}) => {
                    this.hasTwoFactor = data.TwoFactor === 1;
                });

                networkActivityTracker.track(promise);
            }

            $timeout(() => document.getElementById('loginPassword').focus(), 100, false);
        }
    });
}
export default loginPasswordModal;
