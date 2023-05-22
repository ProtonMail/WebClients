import { Currency } from '@proton/shared/lib/interfaces';

import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from './constants';

export interface CardPayment {
    Type: PAYMENT_METHOD_TYPES.CARD;
    Details: {
        Name?: string;
        Number: string;
        ExpMonth: string;
        ExpYear: string;
        CVC: string;
        ZIP: string;
        Country: string;
    };
}

export function isCardPayment(payment: any): payment is CardPayment {
    return payment?.Type === PAYMENT_METHOD_TYPES.CARD && !!payment?.Details;
}

export interface TokenPayment {
    Type: PAYMENT_METHOD_TYPES.TOKEN;
    Details: {
        Token: string;
    };
}

export function isTokenPayment(payment: any): payment is TokenPayment {
    return payment?.Type === PAYMENT_METHOD_TYPES.TOKEN || !!(payment as any)?.Details?.Token;
}

export interface PaypalPayment {
    Type: PAYMENT_METHOD_TYPES.PAYPAL | PAYMENT_METHOD_TYPES.PAYPAL_CREDIT;
}

export interface WrappedPaypalPayment {
    Payment: PaypalPayment;
}

export function isPaypalPayment(payment: any): payment is PaypalPayment {
    return (
        payment && (payment.Type === PAYMENT_METHOD_TYPES.PAYPAL || payment.Type === PAYMENT_METHOD_TYPES.PAYPAL_CREDIT)
    );
}

export interface ExistingPayment {
    PaymentMethodID: string;
}

export function isExistingPayment(data: any): data is ExistingPayment {
    return !!data && typeof data.PaymentMethodID === 'string';
}

export interface WrappedCardPayment {
    Payment: CardPayment;
}

export interface TokenPaymentMethod {
    Payment: TokenPayment;
}

export function isTokenPaymentMethod(data: any): data is TokenPaymentMethod {
    return !!data && isTokenPayment(data.Payment);
}

export interface AmountAndCurrency {
    Amount: number;
    Currency: Currency;
}

export interface CardModel {
    fullname?: string;
    number: string;
    month: string;
    year: string;
    cvc: string;
    zip: string;
    country: string;
}

export interface PaymentTokenResult {
    Token: string;
    Status: PAYMENT_TOKEN_STATUS;
    ApprovalURL?: string;
    ReturnHost?: string;
}

export type PlainPaymentMethodType = `${PAYMENT_METHOD_TYPES}`;
