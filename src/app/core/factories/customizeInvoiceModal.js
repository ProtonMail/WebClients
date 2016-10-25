angular.module('proton.core')
.factory('customizeInvoiceModal', (pmModal, Setting, notify, authentication) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/customizeInvoice.tpl.html',
        controller(params) {
            this.text = authentication.user.InvoiceText || '';

            this.submit = function () {
                Setting.invoiceText({ InvoiceText: this.text })
                .then(function (result) {
                    if (result.data && result.data.Code === 1000) {
                        authentication.user.InvoiceText = this.text;
                        notify({ message: 'Invoice customized', classes: 'notification-success' });
                        params.cancel();
                    } else if (result.data && result.data.Error) {
                        notify({ message: result.data.Error, classes: 'notification-danger' });
                    }
                });
            }.bind(this);

            this.cancel = function () {
                params.cancel();
            };
        }
    });
});
