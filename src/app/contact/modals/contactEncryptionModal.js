import _ from 'lodash';

/* @ngInject */
function contactEncryptionModal(pmModal, gettextCatalog) {
    const I18N = {
        title({ email }) {
            return gettextCatalog.getString('Advanced settings ({{email}})', { email }, 'Title');
        }
    };

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
            this.title = I18N.title(params);
            this.email = params.email;
            this.contact = params.contact;
            this.form = params.form;
            this.internalKeys = params.internalKeys;

            this.directSave = params.directSave;
            this.cancel = () => params.close();
            this.save = () => params.save(this.model);
        }
    });
}
export default contactEncryptionModal;
