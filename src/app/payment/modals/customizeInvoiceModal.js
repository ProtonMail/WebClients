/* @ngInject */
function customizeInvoiceModal(eventManager, pmModal, settingsApi, notification, userSettingsModel, networkActivityTracker) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/customizeInvoice.tpl.html'),
        /* @ngInject */
        controller: function($scope, params) {
            this.text = userSettingsModel.get('InvoiceText') || '';
            this.cancel = params.cancel;

            this.submit = () => {

                if ($scope.customizeInvoiceModalForm.$invalid) {
                    return;
                }

                const promise = settingsApi
                    .invoiceText({ InvoiceText: this.text })
                    .then(() => {
                        notification.success('Invoice customized');
                        params.cancel();
                    })
                    .then(eventManager.call);

                networkActivityTracker.track(promise);
            };
        }
    });
}
export default customizeInvoiceModal;
