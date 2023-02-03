import { PAYMENT_METHOD_TYPES } from '../constants';

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

export type PaymentMethodCardDetails = {
    Order: number;
    ID: string;
    Type: PAYMENT_METHOD_TYPES.CARD;
    Details: CardDetails;
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
