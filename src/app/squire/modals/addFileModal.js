/* @ngInject */
function addFileModal(pmModal, gettextCatalog, translator) {
    const I18N = translator(() => ({
        insert: {
            formTitle: gettextCatalog.getString('Insert image', null, 'Composer, add File'),
            actionTitle: gettextCatalog.getString('Insert', null, 'Composer, add File'),
            addFileTitle: gettextCatalog.getString('Add file', null, 'Composer, add File'),
            deleteTitle: gettextCatalog.getString('Delete', null, 'Composer, add File')
        }
    }));

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/squire/addFile.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const titles = I18N.insert;

            this.formTitle = titles.formTitle;
            this.actionTitle = titles.actionTitle;
            this.addFileTitle = titles.addFileTitle;
            this.deleteTitle = titles.deleteTitle;

            this.image = params.image;
            this.form = params.form;
            this.canAddFile = params.canAddFile;

            this.submit = () => params.submit(this.image, this.form);
            this.addFile = () => params.addFile();
            this.delete = () => params.delete();
            this.cancel = () => params.cancel();
        }
    });
}
export default addFileModal;
