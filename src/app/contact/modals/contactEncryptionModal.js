/* @ngInject */
function contactEncryptionModal(pmModal, contactPgpModel, gettextCatalog) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/contactEncryptionModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.model = params.model;
            this.title = gettextCatalog.getString('Advanced settings ({{email}})', params, 'Title');
            this.email = params.email;
            this.form = params.form;
            this.internalKeys = params.internalKeys;
            this.directSave = params.directSave;
            this.submit = () => params.save(contactPgpModel.getModel());
        }
    });
}
export default contactEncryptionModal;
