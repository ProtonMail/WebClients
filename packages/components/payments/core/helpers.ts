import type { PlainPaymentMethodType } from './interface';

export function isChargebeePaymentMethod(paymentMethodType: PlainPaymentMethodType | undefined) {
    if (!paymentMethodType) {
        return false;
    }

    switch (paymentMethodType) {
        case 'card':
        case 'paypal':
        case 'paypal-credit':
        case 'bitcoin':
        case 'cash':
        case 'token':
            return false;

        case 'chargebee-bitcoin':
        case 'chargebee-card':
        case 'chargebee-paypal':
            return true;
    }
}
