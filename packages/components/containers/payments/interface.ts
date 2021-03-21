import { PAYMENT_METHOD_TYPE } from 'proton-shared/lib/constants';

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
    Currency: string;
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
