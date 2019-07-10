/* @ngInject */
function helpLoginModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/authentication/modals/helpLoginModal.tpl.html'),
        /* @ngInject */
        controller: function() {}
    });
}
export default helpLoginModal;
