/* @ngInject */
function contactPhotoModal(pmModal) {

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/contactPhotoModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.uri = params.uri || '';
            this.submit = params.submit;
            this.cancel = params.cancel;
        }
    });
}

export default contactPhotoModal;
