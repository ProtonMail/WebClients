import { PaymentMethodsModel } from '@proton/shared/lib/models/paymentMethodsModel';

import { SavedPaymentMethod } from '../payments/core';
import createUseModelHook from './helpers/createModelHook';

export default createUseModelHook<SavedPaymentMethod[]>(PaymentMethodsModel);
