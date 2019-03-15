/* @ngInject */
function contactEncryptionModal(pmModal, gettextCatalog, contactPgpModel, translator) {
    const I18N = translator(() => ({
        title({ email }) {
            return gettextCatalog.getString('Advanced settings ({{email}})', { email }, 'Title');
        }
    }));

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/contactEncryptionModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.model = params.model;
            this.title = I18N.title(params);
            this.email = params.email;
            this.form = params.form;
            this.internalKeys = params.internalKeys;
            this.directSave = params.directSave;
            this.cancel = () => params.close();
            this.save = () => params.save(contactPgpModel.getModel());
        }
    });
}
export default contactEncryptionModal;
