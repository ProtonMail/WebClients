/* @ngInject */
function setupAddressModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/address/setupAddressModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { submit, cancel } = params;

            this.model = { DisplayName: '', Signature: '' };
            this.submit = () => submit(this.model);
            this.cancel = cancel;
        }
    });
}
export default setupAddressModal;
