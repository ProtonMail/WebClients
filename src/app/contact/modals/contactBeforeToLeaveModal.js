/* @ngInject */
function contactBeforeToLeaveModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/contactBeforeToLeaveModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.save = params.save;
            this.discard = params.discard;
            this.cancel = params.cancel;
        }
    });
}
export default contactBeforeToLeaveModal;
