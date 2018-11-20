/* @ngInject */
function blackFridayModal(pmModal, blackFridayModel, dispatchers) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/blackFriday/blackFridayModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { on, unsubscribe } = dispatchers();

            on('blackFriday', (e, { type }) => {
                if (type === 'closeModal') {
                    params.close();
                }
            });

            this.$onDestroy = () => {
                blackFridayModel.saveClose();
                unsubscribe();
            };
        }
    });
}
export default blackFridayModal;
