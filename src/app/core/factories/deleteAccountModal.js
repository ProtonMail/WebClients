angular.module('proton.core')
.factory('deleteAccountModal', (pmModal) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/deleteAccount.tpl.html',
        controller(params) {
            // Variables
            this.feedback = '';
            this.password = '';

            // Functions
            this.submit = function () {
                params.submit(this.password, this.feedback);
            }.bind(this);

            this.cancel = function () {
                params.cancel();
            };
        }
    });
});
