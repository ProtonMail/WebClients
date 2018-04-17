/* @ngInject */
function trustPublicKeyModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/trustPublicKey.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.keyInfo = params.keyInfo;
            this.addresses = params.addresses;
            this.isInternal = params.isInternal;
            this.cancel = params.cancel;
            this.submit = () => {
                params.submit(this.addresses);
            };
        }
    });
}
export default trustPublicKeyModal;
