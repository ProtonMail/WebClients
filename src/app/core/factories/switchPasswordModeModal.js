angular.module('proton.core')
.factory('switchPasswordModeModal', (authentication, gettextCatalog) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/switchPasswordMode.tpl.html',
        controller(params) {
            const self = this;
            self.currentPasswordMode = authentication.user.PasswordMode;
            self.save = () => {

            };
            self.cancel = params.cancel;
        }
    });
});
