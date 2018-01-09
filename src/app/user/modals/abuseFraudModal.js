/* @ngInject */
function abuseFraudModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/abuseFraudModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.close = params.close;
        }
    });
}
export default abuseFraudModal;
