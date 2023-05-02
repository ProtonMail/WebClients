import { PAYMENT_METHOD_TYPES, PlainPaymentMethodType } from '../constants';

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

export interface CardDetails {
    Name: string;
    ExpMonth: string;
    ExpYear: string;
    ZIP: string;
    Country: string;
    Last4: string;
    Brand: string;
}

export function isCardDetails(obj: any): obj is CardDetails {
    if (!obj) {
        return false;
    }

    const props: (keyof CardDetails)[] = ['Name', 'ExpMonth', 'ExpYear', 'ZIP', 'Country', 'Last4', 'Brand'];

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
    Details: CardDetails;
    Autopay: Autopay;
};

export type PaymentMethodPaypal = {
    Order: number;
    ID: string;
    Type: PAYMENT_METHOD_TYPES.PAYPAL | PAYMENT_METHOD_TYPES.PAYPAL_CREDIT;
    Details: PayPalDetails;
};

export type PaymentMethod = PaymentMethodPaypal | PaymentMethodCardDetails;

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

export function isExistingPaymentMethod(paymentMethod: PaymentMethodType): paymentMethod is ExistingPaymentMethod {
    return typeof paymentMethod === 'string' && !methodMatches(paymentMethod, Object.values(PAYMENT_METHOD_TYPES));
}

export type PaymentMethodType = PlainPaymentMethodType | ExistingPaymentMethod;
