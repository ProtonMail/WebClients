import { c } from 'ttag';

import { IcMoneyBills } from '@proton/icons/icons/IcMoneyBills';
import type { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';

import type { PaymentMethodUi } from '../paymentMethodUi';

export const cashPaymentMethodUi: PaymentMethodUi<PAYMENT_METHOD_TYPES.CASH> = {
    newMethodView: () => ({ icon: IcMoneyBills, text: c('Label').t`Cash` }),
};
