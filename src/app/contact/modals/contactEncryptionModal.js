import _ from 'lodash';

/* @ngInject */
function contactEncryptionModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/contactEncryptionModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.model = _.mapValues(params.model, (val) =>
                _.map(val, (item) => {
                    item.key = item.key || item.type;
                    return item;
                })
            );
            this.title = `Advanced settings (${params.email})`;
            this.email = params.email;
            this.form = params.form;
            this.class = 'contact-encryption-modal';
            this.internalKeys = params.internalKeys;

            this.cancel = () => params.close();
            this.save = () => params.save(this.model);
        }
    });
}
export default contactEncryptionModal;
