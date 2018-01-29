/* @ngInject */
function cardModal(pmModal, Payment, gettextCatalog, cardModel, networkActivityTracker, paymentModel) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/card.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            // Variables
            const self = this;
            self.card = {};

            if (params.method) {
                self.text = gettextCatalog.getString('Update your credit card information.', null, 'Credit card modal');
                self.mode = 'display';
                self.panel = {
                    fullname: params.method.Details.Name,
                    number: '•••• •••• •••• ' + params.method.Details.Last4,
                    month: params.method.Details.ExpMonth,
                    year: params.method.Details.ExpYear,
                    cvc: '•••',
                    zip: params.method.Details.ZIP,
                    country: params.method.Details.Country
                };
            } else {
                self.text = gettextCatalog.getString('Add a credit card.', null, 'Credit card modal');
                self.mode = 'edition';
            }

            // Functions
            const method = () => {
                if (self.mode === 'edition') {
                    const card = cardModel(self.card);
                    return Payment.updateMethod({ Type: 'card', Details: card.details() })
                        .then(({ data = {} } = {}) => data.PaymentMethod)
                        .catch(({ data = {} }) => {
                            throw Error(data.Error);
                        });
                }
                return Promise.resolve();
            };

            self.edit = () => {
                self.card.fullname = self.panel.fullname;
                self.mode = 'edition';
            };

            self.submit = () => {
                const promise = method()
                    .then((method) => {
                        return paymentModel.getMethods(true).then((methods) => ({ method, methods }));
                    })
                    .then(params.close);
                networkActivityTracker.track(promise);
            };

            self.cancel = params.close;
        }
    });
}
export default cardModal;
