/* @ngInject */
function discardModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/utils/discardModal.tpl.html'),
        /* @ngInject */
        controller: function(params, gettextCatalog) {
            const I18N = {
                title: gettextCatalog.getString('Warning', null, 'Confirm message'),
                message: gettextCatalog.getString(
                    'By cancelling, you will loose all your changes. Do you want to cancel anyway?',
                    null,
                    'Confirm message'
                ),
                button: {
                    discard: gettextCatalog.getString('discard', null, 'Confirm message'),
                    confirm: gettextCatalog.getString('save', null, 'Confirm message')
                }
            };

            this.i18n = {
                ...I18N,
                ...params.I18N
            };

            this.submit = params.confirm;
            this.discard = params.discard;
            this.cancel = params.cancel;
        }
    });
}
export default discardModal;
