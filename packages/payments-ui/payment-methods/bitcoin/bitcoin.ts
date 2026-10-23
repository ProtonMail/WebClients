import { c } from 'ttag';

import { IcBrandBitcoin } from '@proton/icons/icons/IcBrandBitcoin';
import type { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';

import type { PaymentMethodUi } from '../paymentMethodUi';

export const bitcoinPaymentMethodUi: PaymentMethodUi<PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN> = {
    newMethodView: () => ({
        icon: IcBrandBitcoin,
        text: c('Payment method option').t`Bitcoin`,
    }),
};
