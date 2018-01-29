import _ from 'lodash';

/* @ngInject */
function signatureModal(pmModal, tools) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/signature.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { DisplayName, Signature } = params.address;

            this.address = params.address;
            this.model = { DisplayName, Signature: tools.replaceLineBreaks(Signature) };
            this.cancel = params.cancel;
            this.confirm = () => {
                const { DisplayName, Signature } = this.model;
                const address = _.extend({}, params.address, { Signature, DisplayName });

                params.confirm(address);
            };
        }
    });
}
export default signatureModal;
