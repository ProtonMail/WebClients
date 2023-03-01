import { PaymentMethod } from '@proton/shared/lib/interfaces';
import { PaymentMethodsModel } from '@proton/shared/lib/models/paymentMethodsModel';

import createUseModelHook from './helpers/createModelHook';

export default createUseModelHook<PaymentMethod[]>(PaymentMethodsModel);
