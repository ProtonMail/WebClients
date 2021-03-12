import { PAYMENT_METHOD_TYPES } from '../constants';

export interface PaymentStatus {
    Card: boolean;
    Paypal: boolean;
    Apple: boolean;
    Cash: boolean;
    Bitcoin: boolean;
}

export interface PayPalDetails {
    BillingAgreementID: string;
    PayerID: string;
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

export type PaymentMethod =
    | {
          Order: number;
          ID: string;
          Type: PAYMENT_METHOD_TYPES.PAYPAL | PAYMENT_METHOD_TYPES.PAYPAL_CREDIT;
          Details: PayPalDetails;
      }
    | {
          Order: number;
          ID: string;
          Type: PAYMENT_METHOD_TYPES.CARD;
          Details: CardDetails;
      };
