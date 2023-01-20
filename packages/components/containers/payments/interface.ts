import { CYCLE, PAYMENT_METHOD_TYPE } from '@proton/shared/lib/constants';
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

export interface Payment {
    Type: PAYMENT_METHOD_TYPE;
    Details: TokenPaymentDetails | CardPaymentDetails;
}

export interface PaymentParameters {
    PaymentMethodID?: string;
    Payment?: Payment;
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
