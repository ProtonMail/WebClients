/* @ngInject */
function contactDisplayModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/contactDisplayModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.vcard = params.vcard;
            this.close = params.close;
        }
    });
}
export default contactDisplayModal;
