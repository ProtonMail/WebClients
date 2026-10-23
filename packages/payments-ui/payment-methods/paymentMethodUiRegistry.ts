import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { SavedMethodType } from '@proton/payments/core/interface';

import { applePayPaymentMethodUi } from './apple-pay/apple-pay';
import { bitcoinPaymentMethodUi } from './bitcoin/bitcoin';
import { cardPaymentMethodUi } from './card/card';
import { cashPaymentMethodUi } from './cash/cash';
import { googlePayPaymentMethodUi } from './google-pay/google-pay';
import { idealPaymentMethodUi } from './ideal/ideal';
import type { PaymentMethodUi, SavedMethodUi } from './paymentMethodUi';
import { paypalPaymentMethodUi } from './paypal/paypal';
import { sepaPaymentMethodUi } from './sepa/sepa';

const paymentMethodUiRegistry: { [T in PAYMENT_METHOD_TYPES]: PaymentMethodUi<T> } = {
    [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD]: cardPaymentMethodUi,
    [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL]: paypalPaymentMethodUi,
    [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT]: sepaPaymentMethodUi,
    [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL]: idealPaymentMethodUi,
    [PAYMENT_METHOD_TYPES.APPLE_PAY]: applePayPaymentMethodUi,
    [PAYMENT_METHOD_TYPES.GOOGLE_PAY]: googlePayPaymentMethodUi,
    [PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN]: bitcoinPaymentMethodUi,
    [PAYMENT_METHOD_TYPES.CASH]: cashPaymentMethodUi,
    [PAYMENT_METHOD_TYPES.TOKEN]: {},
};

export const getPaymentMethodUi = (type: PAYMENT_METHOD_TYPES): PaymentMethodUi<PAYMENT_METHOD_TYPES> | undefined =>
    paymentMethodUiRegistry[type];

export const getSavedMethodUi = (type: SavedMethodType) =>
    paymentMethodUiRegistry[type] as Partial<SavedMethodUi<SavedMethodType>> | undefined;
