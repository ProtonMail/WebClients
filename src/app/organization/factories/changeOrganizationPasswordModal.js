angular.module('proton.organization')
.factory('changeOrganizationPasswordModal', (pmModal) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/changeOrganizationPassword.tpl.html',
        controller(params) {
            const self = this;
            self.newPassword = '';
            self.confirmPassword = '';
            self.submit = () => params.close(self.newPassword);
            self.cancel = params.close;
            setTimeout(() => document.getElementById('newPassword').focus(), 0);
        }
    });
});
