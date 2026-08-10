import { PAYMENT_METHOD_TYPES } from '../constants';

/**
 * Some payment methods can be saved by the system to be used later in the subsequent payments.
 * Bitcoin, for example, can't be saved, because user has to initiate transaction every time.
 */
export function isSavablePaymentMethod(type: PAYMENT_METHOD_TYPES): boolean {
    const config: Record<PAYMENT_METHOD_TYPES, boolean> = {
        [PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN]: false,
        [PAYMENT_METHOD_TYPES.CASH]: false,
        [PAYMENT_METHOD_TYPES.TOKEN]: false,
        [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD]: true,
        [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL]: true,
        [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT]: true,
        [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL]: true,
        [PAYMENT_METHOD_TYPES.APPLE_PAY]: true,
        [PAYMENT_METHOD_TYPES.GOOGLE_PAY]: true,
    };

    return config[type] ?? false;
}
