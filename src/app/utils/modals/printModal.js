/* @ngInject */
function printModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/utils/printModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.type = params.type;
            this.config = params.config;
            this.cancel = () => params.cancel();
            this.print = () => window.print();

            setTimeout(() => {
                window.print();
            }, 200);
        }
    });
}
export default printModal;
