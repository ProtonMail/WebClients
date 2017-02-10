angular.module('proton.core')
.factory('loginPasswordModal', ($timeout, pmModal, srp, networkActivityTracker) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/loginPassword.tpl.html',
        controller(params) {
            const self = this;

            self.loginPassword = '';
            self.twoFactorCode = '';
            self.submit = () => params.submit(self.loginPassword, self.twoFactorCode);
            self.cancel = () => params.cancel();

            const promise = srp.info()
            .then(({ data = {} } = {}) => {
                if (data.Code === 1000) {
                    self.hasTwoFactor = data.TwoFactor === 1;
                }
            });

            networkActivityTracker.track(promise);
            $timeout(() => document.getElementById('loginPassword').focus(), 100, false);
        }
    });
});
