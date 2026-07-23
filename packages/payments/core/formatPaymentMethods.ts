import orderBy from '@proton/utils/orderBy';

import { PAYMENT_METHOD_TYPES } from './constants';
import type {
    PaymentMethodApplePay,
    PaymentMethodCardDetails,
    PaymentMethodGooglePay,
    PaymentMethodPaypal,
    PaymentMethodSepa,
    SavedPaymentMethod,
} from './interface';

function isSavedPaymentMethodSepa(obj: any): obj is PaymentMethodSepa {
    return (
        obj.Type === 'sepa-direct-debit' ||
        obj.Type === 'sepadirectdebit' ||
        (obj.Type === 'sepa_direct_debit' && !!obj.Details)
    );
}

function isSavedPaymentMethodApplePay(obj: any): obj is PaymentMethodApplePay {
    return (obj.Type === 'applepay' || obj.Type === PAYMENT_METHOD_TYPES.APPLE_PAY) && !!obj.Details;
}

function isSavedPaymentMethodGooglePay(obj: any): obj is PaymentMethodGooglePay {
    return (obj.Type === 'googlepay' || obj.Type === PAYMENT_METHOD_TYPES.GOOGLE_PAY) && !!obj.Details;
}

function isSavedPaymentMethodPaypal(obj: any): obj is PaymentMethodPaypal {
    return (obj.Type === 'paypal' || obj.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL) && !!obj.Details;
}

function isSavedPaymentMethodCard(obj: any): obj is PaymentMethodCardDetails {
    return (obj.Type === 'card' || obj.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD) && !!obj.Details;
}

export function formatPaymentMethod(method: SavedPaymentMethod): SavedPaymentMethod {
    if (isSavedPaymentMethodSepa(method)) {
        return {
            ...method,
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
        } as PaymentMethodSepa;
    }

    if (isSavedPaymentMethodApplePay(method)) {
        return {
            ...method,
            Type: PAYMENT_METHOD_TYPES.APPLE_PAY,
        } as PaymentMethodApplePay;
    }

    if (isSavedPaymentMethodGooglePay(method)) {
        return {
            ...method,
            Type: PAYMENT_METHOD_TYPES.GOOGLE_PAY,
        } as PaymentMethodGooglePay;
    }

    if (isSavedPaymentMethodPaypal(method)) {
        return {
            ...method,
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
        } as PaymentMethodPaypal;
    }

    if (isSavedPaymentMethodCard(method)) {
        return {
            ...method,
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
        } as PaymentMethodCardDetails;
    }

    return method;
}

function markDefaultPaymentMethod(paymentMethods: SavedPaymentMethod[]): SavedPaymentMethod[] {
    if (!paymentMethods || paymentMethods.length === 0) {
        return paymentMethods;
    }

    const sortedPaymentMethods = orderBy(paymentMethods, 'Order');

    return sortedPaymentMethods.map(
        (paymentMethod, index) =>
            ({
                ...paymentMethod,
                IsDefault: index === 0,
            }) as SavedPaymentMethod
    );
}

export function formatPaymentMethods(paymentMethods: SavedPaymentMethod[]): SavedPaymentMethod[] {
    return markDefaultPaymentMethod(paymentMethods.map(formatPaymentMethod));
}
