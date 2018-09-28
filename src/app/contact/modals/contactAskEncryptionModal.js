/* @ngInject */
function contactAskEncryptionModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/contactAskEncryptionModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.email = params.email;
            this.no = () => {
                params.submit({ applyToAll: this.applyToAll, encrypt: false });
            };
            this.yes = () => {
                params.submit({ applyToAll: this.applyToAll, encrypt: true });
            };
            this.applyToAll = false;
        }
    });
}
export default contactAskEncryptionModal;
