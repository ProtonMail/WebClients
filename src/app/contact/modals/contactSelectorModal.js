/* @ngInject */
function contactSelectorModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/contactSelectorModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            Object.assign(this, params);
        }
    });
}
export default contactSelectorModal;
