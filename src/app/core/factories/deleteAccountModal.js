angular.module('proton.core')
.factory('deleteAccountModal', (pmModal) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/deleteAccount.tpl.html',
        controller(params) {
            // Variables
            const self = this;
            self.feedback = '';
            self.password = '';

            // Functions
            self.submit = () => {
                params.submit(self.password, self.feedback);
            };

            self.cancel = () => {
                params.cancel();
            };
        }
    });
});
