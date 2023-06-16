import { PlanIDs } from 'proton-account/src/app/signup/interfaces';

import { Autopay, WrappedCryptoPayment } from '@proton/components/payments/core';
import {
    AmountAndCurrency,
    ChargeablePaymentParameters,
    ExistingPayment,
    TokenPayment,
    TokenPaymentMethod,
    WrappedCardPayment,
    WrappedPaypalPayment,
} from '@proton/components/payments/core/interface';
import { INVOICE_OWNER, INVOICE_STATE, INVOICE_TYPE } from '@proton/shared/lib/constants';

import { ProductParam, getProductHeaders } from '../apps/product';
import { Currency, Cycle, Renew } from '../interfaces';

export const getSubscription = () => ({
    url: 'payments/v4/subscription',
    method: 'get',
});

export interface FeedbackDowngradeData {
    Reason?: string;
    Feedback?: string;
    ReasonDetails?: string;
    Context?: 'vpn' | 'mail';
}

export const deleteSubscription = (data: FeedbackDowngradeData) => ({
    url: 'payments/v4/subscription',
    method: 'delete',
    data,
});

export type CheckSubscriptionData = {
    Plans: PlanIDs;
    Currency: Currency;
    Cycle: Cycle;
    CouponCode?: string;
    Codes?: string[];
};

export const checkSubscription = (data: CheckSubscriptionData) => ({
    url: 'payments/v4/subscription/check',
    method: 'post',
    data,
});

export type SubscribeData = {
    Plans: PlanIDs;
    Currency: Currency;
    Cycle: Cycle;
    Codes?: string[];
} & (TokenPaymentMethod | WrappedCardPayment | ExistingPayment | {}) &
    AmountAndCurrency;

export const subscribe = (data: SubscribeData, product: ProductParam) => ({
    url: 'payments/v4/subscription',
    method: 'post',
    data,
    headers: getProductHeaders(product, {
        endpoint: 'payments/v4/subscription',
        product,
    }),
});

export interface QueryInvoicesParams {
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
export const queryInvoices = ({ Page, PageSize, Owner, State, Type }: QueryInvoicesParams) => ({
    url: 'payments/v4/invoices',
    method: 'get',
    params: { Page, PageSize, Owner, State, Type },
});

export interface QueryPlansParams {
    Currency?: Currency;
}

export const queryPlans = (params?: QueryPlansParams) => ({
    url: 'payments/v4/plans',
    method: 'get',
    params,
});

export const getInvoice = (invoiceID: string) => ({
    url: `payments/v4/invoices/${invoiceID}`,
    method: 'get',
    output: 'arrayBuffer',
});

export const checkInvoice = (invoiceID: string, GiftCode?: string) => ({
    url: `payments/v4/invoices/${invoiceID}/check`,
    method: 'put',
    data: { GiftCode },
});

export const queryPaymentMethods = () => ({
    url: 'payments/v4/methods',
    method: 'get',
});

export type SetPaymentMethodData = TokenPayment & { Autopay?: Autopay };

export const setPaymentMethod = (data: SetPaymentMethodData) => ({
    url: 'payments/v4/methods',
    method: 'post',
    data,
});

export interface UpdatePaymentMethodsData {
    Autopay: Autopay;
}

export const updatePaymentMethod = (methodId: string, data: UpdatePaymentMethodsData) => ({
    url: `payments/v4/methods/${methodId}`,
    method: 'put',
    data,
});

export const deletePaymentMethod = (methodID: string) => ({
    url: `payments/v4/methods/${methodID}`,
    method: 'delete',
});

export const createBitcoinPayment = (Amount: number, Currency: Currency) => ({
    url: 'payments/bitcoin', // blocked by PAY-963
    method: 'post',
    data: { Amount, Currency },
});

export const createBitcoinDonation = (Amount: number, Currency: Currency) => ({
    url: 'payments/bitcoin/donate', // blocked by PAY-963
    method: 'post',
    data: { Amount, Currency },
});

/**
 * @param invoiceID
 * @param data – does not have to include the payment token if user pays from the credits balance. In this case Amount
 * must be set to 0 and payment token must not be supplied.
 */
export const payInvoice = (invoiceID: string, data: (TokenPaymentMethod & AmountAndCurrency) | AmountAndCurrency) => ({
    url: `payments/v4/invoices/${invoiceID}`,
    method: 'post',
    data,
});

export const queryPaymentMethodStatus = () => ({
    url: 'payments/v4/status',
    method: 'get',
});

export const orderPaymentMethods = (PaymentMethodIDs: string[]) => ({
    url: 'payments/v4/methods/order',
    method: 'put',
    data: { PaymentMethodIDs },
});

export interface GiftCodeData {
    GiftCode: string;
    Amount: number;
}

export const buyCredit = (
    data: (TokenPaymentMethod & AmountAndCurrency) | GiftCodeData | ChargeablePaymentParameters
) => ({
    url: 'payments/v4/credit',
    method: 'post',
    data,
});

export interface ValidateCreditData {
    GiftCode: string;
}

export const validateCredit = (data: ValidateCreditData) => ({
    url: 'payments/v4/credit/check',
    method: 'post',
    data,
});

export type CreateBitcoinTokenData = AmountAndCurrency & WrappedCryptoPayment;

export type CreateTokenData =
    | ((AmountAndCurrency | {}) & (WrappedPaypalPayment | WrappedCardPayment | ExistingPayment))
    | CreateBitcoinTokenData;

export const createToken = (data: CreateTokenData) => ({
    url: 'payments/v4/tokens',
    method: 'post',
    data,
});

export const getTokenStatus = (paymentToken: string) => ({
    url: `payments/v4/tokens/${paymentToken}`,
    method: 'get',
});

export const getLastCancelledSubscription = () => ({
    url: 'payments/v4/subscription/latest',
    method: 'get',
});

export interface RenewalStateData {
    RenewalState: Renew;
}

export const changeRenewState = (data: RenewalStateData) => ({
    url: 'payments/v4/subscription/renew',
    method: 'put',
    data,
});
