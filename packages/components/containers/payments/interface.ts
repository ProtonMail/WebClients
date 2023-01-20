import { CYCLE, PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';
import { Currency, PlanIDs } from '@proton/shared/lib/interfaces';

interface TokenPaymentDetails {
    Token: string;
}

interface CardPaymentDetails {
    Name: string;
    Number: string;
    ExpMonth: string;
    ExpYear: string;
    CVC: string;
    ZIP: string;
    Country: string;
}

export interface CardPayment {
    Type: PAYMENT_METHOD_TYPES.CARD;
    Details: CardPaymentDetails;
}

interface TokenPaymentDetails {
    Token: string;
}

export interface TokenPayment {
    Type: PAYMENT_METHOD_TYPES.TOKEN;
    Details: TokenPaymentDetails;
}

export function isTokenPayment(payment?: Payment): payment is TokenPayment {
    return payment?.Type === PAYMENT_METHOD_TYPES.TOKEN || !!(payment as any)?.Details?.Token;
}

export interface PaypalPayment {
    Type: PAYMENT_METHOD_TYPES.PAYPAL | PAYMENT_METHOD_TYPES.PAYPAL_CREDIT;
}

export type Payment = CardPayment | TokenPayment | PaypalPayment;

export interface PaymentParameters<T extends Payment = Payment> {
    PaymentMethodID?: string;
    Payment?: T;
}

export interface Params extends PaymentParameters {
    Amount: number;
    Currency: Currency;
}

export interface CardModel {
    fullname: string;
    number: string;
    month: string;
    year: string;
    cvc: string;
    zip: string;
    country: string;
}

export interface PaymentTokenResult {
    Token: string;
    ApprovalURL: string;
    ReturnHost: string;
    Status: number;
}

export interface EligibleOfferPlans {
    name: string;
    cycle: CYCLE;
    /* Used for the redirect */
    plan: string;
    /* Used for the /check call */
    planIDs: PlanIDs;
    couponCode?: string;
    popular?: boolean;
}

export interface EligibleOffer {
    name: 'black-friday' | 'product-payer';
    isVPNOnly?: boolean;
    plans: EligibleOfferPlans[];
}
