angular.module('proton.core')
.factory('loginPasswordModal', ($timeout, pmModal) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/loginPassword.tpl.html',
        controller(params) {
            this.loginPassword = '';
            this.twoFactorCode = '';
            this.hasTwoFactor = params.hasTwoFactor;

            $timeout(() => {
                $('#loginPassword').focus();
            });

            this.submit = function () {
                params.submit(this.loginPassword, this.twoFactorCode);
            }.bind(this);

            this.cancel = () => {
                params.cancel();
            };
        }
    });
});
