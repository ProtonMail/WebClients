/* @ngInject */
function contactMergerModal(gettextCatalog, pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/contactMergerModal.tpl.html'),
        /* @ngInject */
        controller: function (params) {
            const { duplicates, title, preview, close, merge } = params;

            this.title = title;
            this.duplicates = duplicates;
            this.close = close;
            this.preview = preview;

            /**
             * Click handler for the merge button.
             */
            this.merge = () => {
                merge(this.duplicates);
            };
        }
    });
}

export default contactMergerModal;
