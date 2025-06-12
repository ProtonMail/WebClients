import orderBy from '@proton/utils/orderBy';

import { PAYMENT_METHOD_TYPES } from '../constants';
import { type SavedPaymentMethod } from '../interface';

export function isSavablePaymentMethod(type: PAYMENT_METHOD_TYPES): boolean {
    const config: Record<PAYMENT_METHOD_TYPES, boolean> = {
        [PAYMENT_METHOD_TYPES.CARD]: true,
        [PAYMENT_METHOD_TYPES.PAYPAL]: true,
        [PAYMENT_METHOD_TYPES.PAYPAL_CREDIT]: false,
        [PAYMENT_METHOD_TYPES.BITCOIN]: false,
        [PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN]: false,
        [PAYMENT_METHOD_TYPES.CASH]: false,
        [PAYMENT_METHOD_TYPES.TOKEN]: false,
        [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD]: true,
        [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL]: true,
        [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT]: true,
    };

    return config[type] ?? false;
}

export function getDefaultPaymentMethod(methods: SavedPaymentMethod[]): SavedPaymentMethod | null {
    if (!methods || methods.length === 0) {
        return null;
    }

    const sortedPaymentMethods = orderBy(methods, 'Order');
    return sortedPaymentMethods[0] ?? null;
}
