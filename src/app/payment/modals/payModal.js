/* @ngInject */
function payModal(
    pmModal,
    Payment,
    notification,
    eventManager,
    gettextCatalog,
    paymentUtils,
    networkActivityTracker,
    cardModel
) {
    const I18N = {
        success: gettextCatalog.getString('Invoice paid', null, 'Info')
    };

    const pay = (ID, options = {}) => {
        const promise = Payment.pay(ID, options).catch(({ data = {} } = {}) => {
            throw Error(data.Error);
        });

        networkActivityTracker.track(promise);

        return promise;
    };

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/pay.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.checkInvoice = params.checkInvoice;
            this.invoice = params.invoice;
            this.cancel = params.close;

            const { list, selected } = paymentUtils.generateMethods({ modal: 'invoice' });
            this.methods = list;
            this.method = selected;

            const getParameters = () => {
                const Amount = this.checkInvoice.AmountDue;
                const Currency = this.checkInvoice.Currency;
                const parameters = { Amount, Currency };

                // If the user has enough credits, just send the parameters
                if (!Amount) {
                    return parameters;
                }

                if (this.method.value === 'use.card') {
                    parameters.PaymentMethodID = this.method.ID;
                }

                if (this.method.value === 'card') {
                    parameters.Payment = {
                        Type: 'card',
                        Details: cardModel(this.card).details()
                    };
                }

                if (this.method.value === 'paypal') {
                    parameters.Payment = {
                        Type: 'paypal',
                        Details: this.paypalConfig
                    };
                }

                return parameters;
            };

            this.getPaypalAmount = () => this.checkInvoice.AmountDue / 100;
            this.paypalCallback = (config) => {
                this.paypalConfig = config;
                this.submit();
            };

            this.submit = () => {
                this.process = true;
                pay(params.invoice.ID, getParameters())
                    .then(eventManager.call)
                    .then(() => (this.process = false))
                    .then(() => params.close(true))
                    .then(() => notification.success(I18N.success));
            };
        }
    });
}
export default payModal;
