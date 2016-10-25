angular.module('proton.core')
.factory('reactivateModal', (pmModal) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/reactivate.tpl.html',
        controller(params) {
            this.loginPassword = '';
            this.keyPassword = '';

            /**
             * Submit password
             */
            this.submit = function () {
                if (params.submit) {
                    params.submit(this.loginPassword, this.keyPassword);
                }
            }.bind(this);

            /**
             * Close modal
             */
            this.cancel = () => {
                if (params.cancel) {
                    params.cancel();
                }
            };
        }
    });
});
