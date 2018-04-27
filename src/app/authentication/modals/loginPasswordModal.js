/* @ngInject */
function loginPasswordModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/authentication/modals/loginPassword.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.loginPassword = '';
            this.twoFactorCode = '';
            this.hasTwoFactor = params.hasTwoFactor;
            this.submit = () => params.submit(this.loginPassword, this.twoFactorCode);
            this.cancel = () => params.cancel();
        }
    });
}

export default loginPasswordModal;
