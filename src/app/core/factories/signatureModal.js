import _ from 'lodash';

/* @ngInject */
function signatureModal(pmModal, mailSettingsModel) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/signature.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { DisplayName, Signature } = mailSettingsModel.get();
            this.defaultDisplayName = DisplayName;
            this.defaultSignature = Signature;
            this.address = params.address;
            this.address.DisplayName = this.address.DisplayName || DisplayName;
            this.address.Signature = this.address.Signature || Signature;
            this.address.custom = true;

            this.confirm = function() {
                const adr = _.extend({}, this.address);

                if (!adr.custom) {
                    const { DisplayName, Signature } = mailSettingsModel.get();
                    adr.DisplayName = DisplayName;
                    adr.Signature = Signature;
                }
                params.confirm(adr);
            };

            this.cancel = params.cancel;
        }
    });
}
export default signatureModal;
