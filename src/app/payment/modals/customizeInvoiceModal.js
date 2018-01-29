/* @ngInject */
function customizeInvoiceModal(eventManager, pmModal, settingsApi, notification, userSettingsModel, networkActivityTracker) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/customizeInvoice.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const self = this;

            self.text = userSettingsModel.get('InvoiceText') || '';
            self.cancel = () => params.cancel();

            self.submit = () => {
                const promise = settingsApi
                    .invoiceText({ InvoiceText: self.text })
                    .then(({ data = {} } = {}) => data)
                    .then(() => eventManager.call())
                    .then(() => {
                        notification.success('Invoice customized');
                        params.cancel();
                    });

                networkActivityTracker.track(promise);
            };
        }
    });
}
export default customizeInvoiceModal;
