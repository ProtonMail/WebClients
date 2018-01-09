/* @ngInject */
function signatureModal(pmModal, authentication) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/signature.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.defaultDisplayName = authentication.user.DisplayName;
            this.defaultSignature = authentication.user.Signature;
            this.address = params.address;
            this.address.DisplayName = this.address.DisplayName || authentication.user.DisplayName;
            this.address.Signature = this.address.Signature || authentication.user.Signature;
            this.address.custom = true;

            this.confirm = function() {
                const adr = _.extend({}, this.address);

                if (!adr.custom) {
                    adr.DisplayName = authentication.user.DisplayName;
                    adr.Signature = authentication.user.Signature;
                }
                params.confirm(adr);
            };

            this.cancel = params.cancel;
        }
    });
}
export default signatureModal;
