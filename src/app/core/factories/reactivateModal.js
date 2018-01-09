/* @ngInject */
function reactivateModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/reactivate.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.loginPassword = '';
            this.keyPassword = '';

            /**
             * Submit password
             */
            this.submit = function() {
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
}
export default reactivateModal;
