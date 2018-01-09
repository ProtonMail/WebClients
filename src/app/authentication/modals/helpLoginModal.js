/* @ngInject */
function helpLoginModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/authentication/modals/helpLoginModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.cancel = params.close;
        }
    });
}
export default helpLoginModal;
