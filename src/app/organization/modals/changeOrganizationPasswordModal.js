angular.module('proton.organization')
    .factory('changeOrganizationPasswordModal', (pmModal) => {
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/modals/changeOrganizationPassword.tpl.html',
            /* @ngInject */
            controller: function (params) {
                this.newPassword = '';
                this.confirmPassword = '';
                this.submit = () => params.close(this.newPassword);
                this.cancel = params.close;
                setTimeout(() => document.getElementById('newPassword').focus(), 0);
            }
        });
    });
