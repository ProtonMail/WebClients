/* @ngInject */
function dropIE11ModalModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/browserSupport/dropIE11ModalModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            // Required for cancel / close actions
            console.log(params);
        }
    });
}
export default dropIE11ModalModal;
