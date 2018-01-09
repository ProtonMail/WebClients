/* @ngInject */
function supportModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/support.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.cancel = () => {
                if (params.cancel) {
                    params.cancel();
                }
            };
        }
    });
}
export default supportModal;
