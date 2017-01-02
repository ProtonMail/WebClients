angular.module('proton.core')
.factory('changeOrganizationPasswordModal', (pmModal) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/changeOrganizationPassword.tpl.html',
        controller(params) {
            const self = this;
            self.newRecoveryPassword = '';
            self.confirmRecoveryPassword = '';
            self.submit = () => {
                params.close(self.newRecoveryPassword);
            };
            self.cancel = () => {
                params.close();
            };
            setTimeout(() => document.getElementById('newRecoveryPassword').focus(), 0);
        }
    });
});
