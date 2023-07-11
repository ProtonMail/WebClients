import { Currency } from '@proton/shared/lib/interfaces';

import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from './constants';

export interface CreateCardDetailsBackend {
    Name?: string;
    Number: string;
    ExpMonth: string;
    ExpYear: string;
    CVC: string;
    ZIP: string;
    Country: string;
}

export interface CardPayment {
    Type: PAYMENT_METHOD_TYPES.CARD;
    Details: CreateCardDetailsBackend;
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

export interface PaymentTokenResult {
    Token: string;
    Status: PAYMENT_TOKEN_STATUS;
    ApprovalURL?: string;
    ReturnHost?: string;
}

export type PlainPaymentMethodType = `${PAYMENT_METHOD_TYPES}`;

export type ChargeablePaymentParameters = Partial<TokenPaymentMethod> &
    AmountAndCurrency & {
        type: PAYMENT_METHOD_TYPES.PAYPAL | PAYMENT_METHOD_TYPES.PAYPAL_CREDIT | PAYMENT_METHOD_TYPES.CARD;
        chargeable: true;
    };

export type ChargeablePaymentToken = TokenPaymentMethod &
    AmountAndCurrency & {
        type: PAYMENT_METHOD_TYPES.PAYPAL | PAYMENT_METHOD_TYPES.PAYPAL_CREDIT | PAYMENT_METHOD_TYPES.CARD;
        chargeable: true;
    };

export type NonChargeablePaymentToken = Omit<ChargeablePaymentToken, 'chargeable'> & {
    chargeable: false;
    status: PAYMENT_TOKEN_STATUS;
    returnHost: string;
    approvalURL: string;
};

export interface PaymentMethodStatus {
    Card: boolean;
    Paypal: boolean;
    Apple: boolean;
    Cash: boolean;
    Bitcoin: boolean;
}

export interface PayPalDetails {
    BillingAgreementID: string;
    PayerID: string;
    Payer: string;
}

export function isPaypalDetails(obj: any): obj is PayPalDetails {
    if (!obj) {
        return false;
    }

    const props: (keyof PayPalDetails)[] = ['BillingAgreementID', 'PayerID'];

    return props.every((prop) => typeof obj[prop] === 'string');
}

export interface SavedCardDetails {
    Name: string;
    ExpMonth: string;
    ExpYear: string;
    ZIP: string;
    Country: string;
    Last4: string;
    Brand: string;
}

export function isSavedCardDetails(obj: any): obj is SavedCardDetails {
    if (!obj) {
        return false;
    }

    const props: (keyof SavedCardDetails)[] = ['Name', 'ExpMonth', 'ExpYear', 'ZIP', 'Country', 'Last4', 'Brand'];

    return props.every((prop) => typeof obj[prop] === 'string');
}

export enum Autopay {
    DISABLE = 0,
    ENABLE = 1,
}

export type PaymentMethodCardDetails = {
    Order: number;
    ID: string;
    Type: PAYMENT_METHOD_TYPES.CARD;
    Details: SavedCardDetails;
    Autopay: Autopay;
};

export type PaymentMethodPaypal = {
    Order: number;
    ID: string;
    Type: PAYMENT_METHOD_TYPES.PAYPAL;
    Details: PayPalDetails;
};

export type SavedPaymentMethod = PaymentMethodPaypal | PaymentMethodCardDetails;

export interface LatestSubscription {
    LastSubscriptionEnd: number;
}

export function methodMatches(
    method: PaymentMethodType | undefined,
    methods: PlainPaymentMethodType[]
): method is PlainPaymentMethodType {
    if (!method) {
        return false;
    }

    return (methods as string[]).includes(method);
}

export type ExistingPaymentMethod = string;

export function isExistingPaymentMethod(paymentMethod?: PaymentMethodType): paymentMethod is ExistingPaymentMethod {
    return (
        paymentMethod !== undefined &&
        typeof paymentMethod === 'string' &&
        !methodMatches(paymentMethod, Object.values(PAYMENT_METHOD_TYPES))
    );
}

export type PaymentMethodType = PlainPaymentMethodType | ExistingPaymentMethod;

export interface AvailablePaymentMethod {
    readonly type: PlainPaymentMethodType;
    readonly paymentMethodId?: string; // defined only for existing payment methods
    readonly isExpired?: boolean; // defined only for existing credit cards
    readonly value: PaymentMethodType;
    readonly isSaved: boolean;
}

export type PaymentMethodFlows =
    | 'invoice'
    | 'signup'
    | 'signup-pass'
    | 'human-verification'
    | 'credit'
    | 'donation'
    | 'subscription';
