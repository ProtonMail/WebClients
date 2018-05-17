/* @ngInject */
function addLinkModal(pmModal, gettextCatalog) {
    const I18N = {
        insert: {
            formTitle: gettextCatalog.getString('Insert link', null, 'Composer, add Link'),
            actionTitle: gettextCatalog.getString('Insert', null, 'Composer, add Link'),
            deleteTitle: gettextCatalog.getString('Delete', null, 'Composer, add Link')
        },
        update: {
            formTitle: gettextCatalog.getString('Edit link', null, 'Composer, add Link'),
            actionTitle: gettextCatalog.getString('Update', null, 'Composer, add Link'),
            deleteTitle: gettextCatalog.getString('Delete', null, 'Composer, add Link')
        }
    };

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/squire/addLink.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const titles = params.isUpdate ? I18N.update : I18N.insert;

            this.isUpdate = params.isUpdate;

            this.formTitle = titles.formTitle;
            this.actionTitle = titles.actionTitle;
            this.deleteTitle = titles.deleteTitle;

            this.link = params.link;
            this.form = params.form;

            this.submit = () => params.submit(this.link, this.form);
            this.delete = () => params.delete();
            this.cancel = () => params.cancel();
        }
    });
}
export default addLinkModal;
