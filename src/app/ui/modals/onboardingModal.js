/* @ngInject */
function onboardingModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/ui/onboardingModal.tpl.html'),
        /* @ngInject */
        controller: function() {
            this.step = 0;
            this.next = () => this.step++;
            this.previous = () => this.step--;
        }
    });
}
export default onboardingModal;
