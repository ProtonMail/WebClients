import { queryPaymentMethods } from '../api/payments';
import updateCollection from '../helpers/updateCollection';

export const getPaymentMethodsModel = (api) => {
    return api(queryPaymentMethods()).then(({ PaymentMethods }) => PaymentMethods);
};

export const PaymentMethodsModel = {
    key: 'PaymentMethods',
    get: getPaymentMethodsModel,
    update: (model, events) => updateCollection({ model, events, item: ({ PaymentMethods }) => PaymentMethods })
};
