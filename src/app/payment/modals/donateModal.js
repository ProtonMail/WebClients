/* @ngInject */
function donateModal(dispatchers, pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/donate.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { on, unsubscribe } = dispatchers();

            this.typeOfModal = params.type;
            this.close = params.close;

            on('payments', (e, { type }) => {
                if (/^(donation|topUp)\.request\.success/.test(type)) {
                    params.close();
                }
            });

            this.$onDestroy = () => unsubscribe();
        }
    });
}
export default donateModal;
