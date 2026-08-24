import type { PaymentIntent } from './types';

export function isCheckoutComPaymentIntent(paymentIntent: PaymentIntent): boolean {
    return paymentIntent.gateway === 'checkout_com';
}
