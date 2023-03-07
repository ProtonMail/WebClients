import { PlanIDs } from 'proton-account/src/app/signup/interfaces';

import { AmountAndCurrency, TokenPaymentMethod } from '@proton/components/containers/payments/interface';
import { INVOICE_OWNER, INVOICE_STATE, INVOICE_TYPE } from '@proton/shared/lib/constants';

import { getProductHeaders } from '../apps/product';
import { Autopay, Currency, Cycle } from '../interfaces';

export const getSubscription = () => ({
    url: 'payments/subscription',
    method: 'get',
});

export interface FeedbackDowngradeData {
    Reason?: string;
    Feedback?: string;
    ReasonDetails?: string;
    Context?: 'vpn' | 'mail';
}

export const deleteSubscription = (data: FeedbackDowngradeData) => ({
    url: 'payments/subscription',
    method: 'delete',
    data,
});

export type CheckSubscriptionParams = {
    Plans: PlanIDs;
    Currency: Currency;
    Cycle: Cycle;
    CouponCode?: string;
    Codes?: string[];
};

export const checkSubscription = (data: CheckSubscriptionParams) => ({
    url: 'payments/subscription/check',
    method: 'post',
    data,
});

export const subscribe = (data: any, product: any) => ({
    url: 'payments/subscription',
    method: 'post',
    data,
    headers: getProductHeaders(product, {
        endpoint: 'payments/subscription',
        product,
    }),
});

export interface QueryInvoicesPayload {
    /**
     * Starts with 0
     */
    Page: number;
    PageSize: number;
    Owner: INVOICE_OWNER;
    State?: INVOICE_STATE;
    Type?: INVOICE_TYPE;
}

/**
 * Query list of invoices for the current user. The response is {@link InvoiceResponse}
 */
export const queryInvoices = ({ Page, PageSize, Owner, State, Type }: QueryInvoicesPayload) => ({
    url: 'payments/invoices',
    method: 'get',
    params: { Page, PageSize, Owner, State, Type },
});

export const queryPlans = (params: any) => ({
    url: 'payments/plans',
    method: 'get',
    params,
});

export const getInvoice = (invoiceID: string) => ({
    url: `payments/invoices/${invoiceID}`,
    method: 'get',
    output: 'arrayBuffer',
});

export const checkInvoice = (invoiceID: string, GiftCode?: string) => ({
    url: `payments/invoices/${invoiceID}/check`,
    method: 'put',
    data: { GiftCode },
});

export const queryPaymentMethods = () => ({
    url: 'payments/methods',
    method: 'get',
});

export const setPaymentMethod = (data: any) => ({
    url: 'payments/methods',
    method: 'post',
    data,
});

export interface UpdatePaymentMethodsParams {
    Autopay: Autopay;
}

export const updatePaymentMethod = (methodId: string, data: UpdatePaymentMethodsParams) => ({
    url: `payments/methods/${methodId}`,
    method: 'put',
    data,
});

export const deletePaymentMethod = (methodID: string) => ({
    url: `payments/methods/${methodID}`,
    method: 'delete',
});

export const createBitcoinPayment = (Amount: number, Currency: Currency) => ({
    url: 'payments/bitcoin',
    method: 'post',
    data: { Amount, Currency },
});

export const createBitcoinDonation = (Amount: number, Currency: Currency) => ({
    url: 'payments/bitcoin/donate',
    method: 'post',
    data: { Amount, Currency },
});

export const createPayPalPayment = (Amount: number, Currency: Currency) => ({
    url: 'payments/paypal',
    method: 'post',
    data: { Amount, Currency },
});

/**
 * @param invoiceID
 * @param data – does not have to include the payment token if user pays from the credits balance. In this case Amount
 * must be set to 0 and payment token must not be supplied.
 */
export const payInvoice = (invoiceID: string, data: (TokenPaymentMethod & AmountAndCurrency) | AmountAndCurrency) => ({
    url: `payments/invoices/${invoiceID}`,
    method: 'post',
    data,
});

export const queryPaymentMethodStatus = () => ({
    url: 'payments/status',
    method: 'get',
});

export const orderPaymentMethods = (PaymentMethodIDs: string[]) => ({
    url: 'payments/methods/order',
    method: 'put',
    data: { PaymentMethodIDs },
});

export const donate = (data: any) => ({
    url: 'payments/donate',
    method: 'post',
    data,
});

export interface GiftCodeData {
    GiftCode: string;
    Amount: number;
}

export const buyCredit = (data: (TokenPaymentMethod & AmountAndCurrency) | GiftCodeData) => ({
    url: 'payments/credit',
    method: 'post',
    data,
});

export const validateCredit = (data: any) => ({
    url: 'payments/credit/check',
    method: 'post',
    data,
});

export interface CreateTokenData {
    Payment?: any;
    Amount?: number;
    Currency?: Currency;
    PaymentMethodID?: string;
}

export const createToken = (data: CreateTokenData) => ({
    url: 'payments/tokens',
    method: 'post',
    data,
});

export const getTokenStatus = (paymentToken: string) => ({
    url: `payments/tokens/${paymentToken}`,
    method: 'get',
});

export const verifyPayment = ({ Amount, Credit, Currency, Payment, GiftCode }: any) => ({
    url: 'payments/verify',
    method: 'post',
    data: { Amount, Credit, Currency, Payment, GiftCode },
});

export const getLastCancelledSubscription = () => ({
    url: 'payments/subscription/latest',
    method: 'get',
});
