/* @ngInject */
function selectAddressModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/address/selectAddressModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { submit, cancel, info, addresses } = params;

            this.info = info;
            this.model = { addresses, address: addresses[0] };
            this.submit = () => submit(this.model.address);
            this.cancel = cancel;
        }
    });
}
export default selectAddressModal;
