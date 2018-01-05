function abuseFraudModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/abuseFraudModal.tpl.html',
        /* @ngInject */
        controller: function(params) {
            this.close = params.close;
        }
    });
}
export default abuseFraudModal;
