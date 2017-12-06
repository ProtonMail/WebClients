/* @ngInject */
function supportModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/support.tpl.html',
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
