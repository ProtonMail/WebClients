/* @ngInject */
function twoFAIntroModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/twofactor/twoFAIntroModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const self = this;
            self.next = () => params.next();
            self.cancel = () => params.cancel();
        }
    });
}
export default twoFAIntroModal;
