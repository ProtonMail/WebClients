/* @ngInject */
function selectAddressModal(addressesModel, pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/address/selectAddressModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const {
                submit,
                cancel,
                info,
                addresses = addressesModel.get(),
                addressID = 'ID',
                label = 'Email'
            } = params;

            this.info = info;
            this.label = label;
            this.addressID = addressID;
            this.model = { addresses, address: addresses[0] };
            this.submit = () => submit(this.model.address);
            this.cancel = cancel;
        }
    });
}
export default selectAddressModal;
