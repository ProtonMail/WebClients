/* @ngInject */
function paymentModal(pmModal, paymentModalModel) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/payment/modal.tpl.html',
        /* @ngInject */
        controller: function(params) {
            paymentModalModel.set(params);
            // submit:Function is coming from the form inside the modal
            this.$onDestroy = () => {
                paymentModalModel.clear();
            };
        }
    });
}
export default paymentModal;
