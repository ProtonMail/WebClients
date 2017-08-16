angular.module('proton.core')
    .factory('customizeInvoiceModal', (eventManager, pmModal, settingsApi, notify, authentication, networkActivityTracker) => {
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/modals/customizeInvoice.tpl.html',
            controller(params) {
                const self = this;

                self.text = authentication.user.InvoiceText || '';
                self.cancel = () => params.cancel();

                self.submit = () => {
                    const promise = settingsApi.invoiceText({ InvoiceText: self.text })
                        .then(({ data = {} } = {}) => {
                            if (data.Error) {
                                throw new Error(data.Error);
                            }

                            return data;
                        })
                        .then(() => eventManager.call())
                        .then(() => {
                            notify({ message: 'Invoice customized', classes: 'notification-success' });
                            params.cancel();
                        });

                    networkActivityTracker.track(promise);
                };
            }
        });
    });
