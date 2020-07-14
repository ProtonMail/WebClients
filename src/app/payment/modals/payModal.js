import { handlePaymentToken } from '../helpers/paymentToken';

/* @ngInject */
function payModal(
    pmModal,
    Payment,
    notification,
    eventManager,
    gettextCatalog,
    paymentUtils,
    networkActivityTracker,
    cardModel,
    translator,
    paymentVerificationModal
) {
    const I18N = translator(() => ({
        success: gettextCatalog.getString('Invoice paid', null, 'Info')
    }));

    const pay = (ID, options = {}) => {
        const promise = Payment.pay(ID, options);

        networkActivityTracker.track(promise);

        return promise;
    };

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/pay.tpl.html'),
        /* @ngInject */
        controller: function(params, $scope) {
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
                        Type: 'token',
                        Details: this.paypalConfig
                    };
                }

                return handlePaymentToken({ params: parameters, paymentApi: Payment, paymentVerificationModal });
            };

            this.getPaypalAmount = () => this.checkInvoice.AmountDue / 100;
            this.paypalCallback = (config) => {
                this.paypalConfig = config;
                this.submit();
            };

            this.submit = async () => {
                try {
                    this.process = true;
                    const parameters = await getParameters();
                    await pay(params.invoice.ID, parameters);
                    await eventManager.call();
                    params.close(true);
                    notification.success(I18N.success);
                } catch (error) {
                    $scope.$applyAsync(() => {
                        this.process = false;
                    });
                    throw error;
                }
            };
        }
    });
}
export default payModal;
