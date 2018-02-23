/* @ngInject */
function paymentModal(dispatchers, pmModal, paymentModalModel) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/payment/modal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { on, unsubscribe } = dispatchers(['subscription']);

            paymentModalModel.set(params);
            // submit:Function is coming from the form inside the modal
            // We need to close the payment modal if the subscription change to avoid "Amount Mismatch" issue (concurrency with payment process).
            on('subscription', (event, { type }) => {
                if (type === 'update' && this.step === 'payment') {
                    params.cancel();
                }
            });

            this.$onDestroy = () => {
                unsubscribe();
                paymentModalModel.clear();
            };
        }
    });
}
export default paymentModal;
