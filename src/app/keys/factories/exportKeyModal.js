/* @ngInject */
function exportKeyModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/exportKeyModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const self = this;

            self.exportPrivate = params.exportPrivate;

            self.exportPublic = params.exportPublic;

            self.cancel = () => {
                params.cancel();
            };
        }
    });
}
export default exportKeyModal;
