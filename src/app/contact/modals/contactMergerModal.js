/* @ngInject */
function contactMergerModal(gettextCatalog, pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/contactMergerModal.tpl.html'),
        /* @ngInject */
        controller: function (params) {
            const { duplicates, title, onClickDetails, onClickPreview, onClickClose, onClickMerge } = params;

            this.title = title;
            this.duplicates = duplicates;
            this.onClickDetails = onClickDetails;
            this.onClickPreview = onClickPreview;
            this.onClickClose = onClickClose;

            /**
             * Click handler for the merge button.
             */
            this.onClickMerge = () => {
                onClickMerge(this.duplicates);
            };
        }
    });
}

export default contactMergerModal;
