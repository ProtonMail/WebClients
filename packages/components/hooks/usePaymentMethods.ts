import { PaymentMethodsModel } from '@proton/shared/lib/models/paymentMethodsModel';

import { PaymentMethod } from '../payments/core';
import createUseModelHook from './helpers/createModelHook';

export default createUseModelHook<PaymentMethod[]>(PaymentMethodsModel);
