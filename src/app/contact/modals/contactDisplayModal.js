/* @ngInject */
function contactDisplayModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/contactDisplayModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { vcard, onClickMerge, onClickClose } = params;

            this.vcard = vcard;
            this.onClickClose = onClickClose;
            this.onClickMerge = onClickMerge;
        }
    });
}
export default contactDisplayModal;
