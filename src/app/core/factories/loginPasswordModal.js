angular.module('proton.core')
.factory('loginPasswordModal', ($timeout, pmModal) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/loginPassword.tpl.html',
        controller(params) {
            const self = this;
            self.loginPassword = '';
            self.twoFactorCode = '';
            self.hasTwoFactor = params.hasTwoFactor;

            $timeout(() => document.getElementById('loginPassword').focus());

            self.submit = () => {
                params.submit(self.loginPassword, self.twoFactorCode);
            };

            self.cancel = () => {
                params.cancel();
            };
        }
    });
});
