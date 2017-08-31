angular.module('proton.core')
    .factory('switchPasswordModeModal', (authentication, pmModal) => {
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/modals/switchPasswordMode.tpl.html',
            /* @ngInject */
            controller: function (params) {
                const self = this;
                self.currentPasswordMode = authentication.user.PasswordMode;
                self.save = () => {

                };
                self.cancel = params.cancel;
            }
        });
    });
