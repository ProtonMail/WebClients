import type { PlanIDs } from 'proton-account/src/app/signup/interfaces';

import type { Autopay, PAYMENT_TOKEN_STATUS, WrappedCryptoPayment } from '@proton/components/payments/core';
import { PAYMENT_METHOD_TYPES } from '@proton/components/payments/core';
import type {
    AmountAndCurrency,
    BillingAddress,
    BillingAddressProperty,
    ChargeablePaymentParameters,
    ExistingPayment,
    SavedPaymentMethod,
    TokenPayment,
    TokenPaymentMethod,
    V5PaymentToken,
    WrappedCardPayment,
    WrappedPaypalPayment,
} from '@proton/components/payments/core';
import { isTokenPaymentMethod, isV5PaymentToken } from '@proton/components/payments/core/interface';
import type { INVOICE_OWNER, INVOICE_STATE, INVOICE_TYPE } from '@proton/shared/lib/constants';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';

import type { ProductParam } from '../apps/product';
import { getProductHeaders } from '../apps/product';
import type { Api, Currency, Cycle, FreePlanDefault, Renew, Subscription } from '../interfaces';

export type PaymentsVersion = 'v4' | 'v5';
let paymentsVersion: PaymentsVersion = 'v4';

export function setPaymentsVersion(version: PaymentsVersion) {
    paymentsVersion = version;
}

export function getPaymentsVersion(): PaymentsVersion {
    return paymentsVersion;
}

export const queryFreePlan = (params?: QueryPlansParams) => ({
    url: `payments/${paymentsVersion}/plans/default`,
    method: 'get',
    params,
});

export const getFreePlan = ({ api, currency }: { api: Api; currency?: Currency }) =>
    api<{ Plans: FreePlanDefault }>(queryFreePlan(currency ? { Currency: currency } : undefined))
        .then(({ Plans }): FreePlanDefault => {
            return {
                ...Plans,
                MaxBaseSpace: Plans.MaxBaseSpace ?? Plans.MaxSpace,
                MaxBaseRewardSpace: Plans.MaxBaseRewardSpace ?? Plans.MaxRewardSpace,
                MaxDriveSpace: Plans.MaxDriveSpace ?? Plans.MaxSpace,
                MaxDriveRewardSpace: Plans.MaxDriveRewardSpace ?? Plans.MaxRewardSpace,
            };
        })
        .catch(() => FREE_PLAN);

export const getSubscription = (forceVersion?: PaymentsVersion) => ({
    url: `payments/${forceVersion ?? paymentsVersion}/subscription`,
    method: 'get',
});

export interface FeedbackDowngradeData {
    Reason?: string;
    Feedback?: string;
    ReasonDetails?: string;
    Context?: 'vpn' | 'mail';
}

export const deleteSubscription = (data: FeedbackDowngradeData, version: PaymentsVersion) => ({
    url: `payments/${version}/subscription`,
    method: 'delete',
    data,
});

export type CheckSubscriptionData = {
    Plans: PlanIDs;
    Currency: Currency;
    Cycle: Cycle;
    CouponCode?: string;
    Codes?: string[];
    /**
     * For taxes
     */
    BillingAddress?: BillingAddress;
};

type CommonSubscribeData = {
    Plans: PlanIDs;
    Currency: Currency;
    Cycle: Cycle;
    Codes?: string[];
} & AmountAndCurrency;

type SubscribeDataV4 = CommonSubscribeData & TokenPaymentMethod & BillingAddressProperty;
type SubscribeDataV5 = CommonSubscribeData & V5PaymentToken & BillingAddressProperty;
type SubscribeDataNoPayment = CommonSubscribeData;
export type SubscribeData = SubscribeDataV4 | SubscribeDataV5 | SubscribeDataNoPayment;

function isCommonSubscribeData(data: any): data is CommonSubscribeData {
    return !!data.Plans && !!data.Currency && !!data.Cycle && !!data.Amount && !!data.Currency;
}

function isSubscribeDataV4(data: any): data is SubscribeDataV4 {
    return isCommonSubscribeData(data) && isTokenPaymentMethod(data);
}

function isSubscribeDataV5(data: any): data is SubscribeDataV5 {
    return isCommonSubscribeData(data) && isV5PaymentToken(data);
}

function isSubscribeDataNoPayment(data: any): data is SubscribeDataNoPayment {
    return isCommonSubscribeData(data);
}

export function isSubscribeData(data: any): data is SubscribeData {
    return isSubscribeDataV4(data) || isSubscribeDataV5(data) || isSubscribeDataNoPayment(data);
}

function prepareSubscribeDataPayload(data: SubscribeData): SubscribeData {
    const allowedProps: (keyof SubscribeDataV4 | keyof SubscribeDataV5)[] = [
        'Plans',
        'Currency',
        'Cycle',
        'Codes',
        'PaymentToken',
        'Payment',
        'Amount',
        'Currency',
        'BillingAddress',
    ];
    const payload: any = {};
    Object.keys(data).forEach((key: any) => {
        if (allowedProps.includes(key)) {
            payload[key] = (data as any)[key];
        }
    });

    return payload as SubscribeData;
}

export const subscribe = (rawData: SubscribeData, product: ProductParam, version: PaymentsVersion) => {
    const sanitizedData = prepareSubscribeDataPayload(rawData);

    let data: SubscribeData = sanitizedData;
    if (version === 'v5' && isSubscribeDataV4(sanitizedData)) {
        const v5Data: SubscribeDataV5 = {
            ...sanitizedData,
            PaymentToken: sanitizedData.Payment.Details.Token,
            v: 5,
        };

        data = v5Data;
        delete (data as any).Payment;
    } else if (version === 'v4' && isSubscribeDataV5(sanitizedData)) {
        const v4Data: SubscribeDataV4 = {
            ...sanitizedData,
            Payment: {
                Type: PAYMENT_METHOD_TYPES.TOKEN,
                Details: {
                    Token: sanitizedData.PaymentToken,
                },
            },
        };

        data = v4Data;
        delete (data as any).PaymentToken;
    }

    const config = {
        url: `payments/${version}/subscription`,
        method: 'post',
        data,
        headers: getProductHeaders(product, {
            endpoint: `payments/${version}/subscription`,
            product,
        }),
        timeout: 60000 * 2,
    };

    return config;
};

export enum InvoiceDocument {
    Invoice = 'invoice',
    CreditNote = 'credit_note',
    CurrencyConversion = 'currency_conversion',
}

export interface QueryInvoicesParams {
    /**
     * Starts with 0
     */
    Page: number;
    PageSize: number;
    Owner: INVOICE_OWNER;
    State?: INVOICE_STATE;
    Type?: INVOICE_TYPE;
    Document?: InvoiceDocument;
}

/**
 * Query list of invoices for the current user. The response is {@link InvoiceResponse}
 */
export const queryInvoices = (params: QueryInvoicesParams, version?: PaymentsVersion) => ({
    url: `payments/${version ?? paymentsVersion}/invoices`,
    method: 'get',
    params,
});

export interface QueryPlansParams {
    Currency?: Currency;
}

export const queryPlans = (params?: QueryPlansParams) => ({
    url: `payments/${paymentsVersion}/plans`,
    method: 'get',
    params,
});

export const getInvoice = (invoiceID: string, version: PaymentsVersion) => ({
    url: `payments/${version}/invoices/${invoiceID}`,
    method: 'get',
    output: 'arrayBuffer',
});

export const checkInvoice = (invoiceID: string, version?: PaymentsVersion, GiftCode?: string) => ({
    url: `payments/${version ?? paymentsVersion}/invoices/${invoiceID}/check`,
    method: 'put',
    data: { GiftCode },
});

export const queryPaymentMethods = (forceVersion?: PaymentsVersion) => ({
    url: `payments/${forceVersion ?? paymentsVersion}/methods`,
    method: 'get',
});

export type SetPaymentMethodDataV4 = TokenPayment & { Autopay?: Autopay };

export const setPaymentMethodV4 = (data: SetPaymentMethodDataV4) => ({
    url: 'payments/v4/methods',
    method: 'post',
    data,
});

export type SetPaymentMethodDataV5 = V5PaymentToken & { Autopay?: Autopay };
export const setPaymentMethodV5 = (data: SetPaymentMethodDataV5) => ({
    url: 'payments/v5/methods',
    method: 'post',
    data,
});

export interface UpdatePaymentMethodsData {
    Autopay: Autopay;
}

export const updatePaymentMethod = (methodId: string, data: UpdatePaymentMethodsData, version: PaymentsVersion) => ({
    url: `payments/${version}/methods/${methodId}`,
    method: 'put',
    data,
});

export const deletePaymentMethod = (methodID: string, version: PaymentsVersion) => ({
    url: `payments/${version}/methods/${methodID}`,
    method: 'delete',
});

/**
 * @param invoiceID
 * @param data – does not have to include the payment token if user pays from the credits balance. In this case Amount
 * must be set to 0 and payment token must not be supplied.
 */
export const payInvoice = (
    invoiceID: string,
    data: (TokenPaymentMethod & AmountAndCurrency) | AmountAndCurrency,
    version: PaymentsVersion
) => ({
    url: `payments/${version}/invoices/${invoiceID}`,
    method: 'post',
    data,
});

export const orderPaymentMethods = (PaymentMethodIDs: string[], version: PaymentsVersion) => ({
    url: `payments/${version}/methods/order`,
    method: 'put',
    data: { PaymentMethodIDs },
});

export interface GiftCodeData {
    GiftCode: string;
    Amount: number;
}

export const buyCredit = (
    data: (TokenPaymentMethod & AmountAndCurrency) | GiftCodeData | ChargeablePaymentParameters,
    forceVersion: PaymentsVersion
) => ({
    url: `payments/${forceVersion ?? paymentsVersion}/credit`,
    method: 'post',
    data,
});

export interface ValidateCreditData {
    GiftCode: string;
}

export const validateCredit = (data: ValidateCreditData, version: PaymentsVersion) => ({
    url: `payments/${version ?? paymentsVersion}/credit/check`,
    method: 'post',
    data,
});

export type CreateBitcoinTokenData = AmountAndCurrency & WrappedCryptoPayment;

export type CreateTokenData =
    | ((AmountAndCurrency | {}) & (WrappedPaypalPayment | WrappedCardPayment | ExistingPayment))
    | CreateBitcoinTokenData;

export const createToken = (data: CreateTokenData, version: PaymentsVersion) => ({
    url: `payments/${version}/tokens`,
    method: 'post',
    data,
});

export const createTokenV4 = (data: CreateTokenData) => createToken(data, 'v4');
export const createTokenV5 = (data: CreateTokenData) => createToken(data, 'v5');

export const getTokenStatus = (paymentToken: string, version: PaymentsVersion) => ({
    url: `payments/${version}/tokens/${paymentToken}`,
    method: 'get',
});

export const getTokenStatusV4 = (paymentToken: string) => getTokenStatus(paymentToken, 'v4');
export const getTokenStatusV5 = (paymentToken: string) => getTokenStatus(paymentToken, 'v5');

export const getLastCancelledSubscription = () => ({
    url: `payments/${paymentsVersion}/subscription/latest`,
    method: 'get',
});

export type RenewalStateData =
    | {
          RenewalState: Renew.Enabled;
      }
    | {
          RenewalState: Renew.Disabled;
          CancellationFeedback: FeedbackDowngradeData;
      };

export const changeRenewState = (data: RenewalStateData, version: PaymentsVersion) => ({
    url: `payments/${version}/subscription/renew`,
    method: 'put',
    data,
});

export type SubscribeV5Data = {
    PaymentToken?: string;
    Plans: PlanIDs;
    Amount: number;
    Currency: Currency;
    Cycle: Cycle;
    Codes?: string[];
};

export type CreatePaymentIntentPaypalData = AmountAndCurrency & {
    Payment: {
        Type: 'paypal';
    };
};

export type CreatePaymentIntentCardData = AmountAndCurrency & {
    Payment: {
        Type: 'card';
        Details: {
            Bin: string;
        };
    };
};

export type CreatePaymentIntentSavedCardData = AmountAndCurrency & {
    PaymentMethodID: string;
};

export type CreatePaymentIntentData =
    | CreatePaymentIntentPaypalData
    | CreatePaymentIntentCardData
    | CreatePaymentIntentSavedCardData;

export const createPaymentIntentV5 = (data: CreatePaymentIntentData) => ({
    url: `payments/v5/tokens`,
    method: 'post',
    data,
});

export type BackendPaymentIntent = {
    ID: string;
    Status: 'inited' | 'authorized';
    Amount: number;
    GatewayAccountID: string;
    ExpiresAt: number;
    PaymentMethodType: 'card' | 'paypal';
    CreatedAt: number;
    ModifiedAt: number;
    UpdatedAt: number;
    ResourceVersion: number;
    Object: 'payment_intent';
    CustomerID: string;
    CurrencyCode: Currency;
    Gateway: string;
    ReferenceID: string;
};

export type FetchPaymentIntentV5Response = {
    Token: string;
    Status: PAYMENT_TOKEN_STATUS;
    Data: BackendPaymentIntent;
};

export const fetchPaymentIntentV5 = (
    api: Api,
    data: CreatePaymentIntentData,
    signal?: AbortSignal
): Promise<FetchPaymentIntentV5Response> => {
    return api<FetchPaymentIntentV5Response>({
        ...createPaymentIntentV5(data),
        signal,
    });
};

export type FetchPaymentIntentForExistingV5Response = {
    Token: string;
    Status: PAYMENT_TOKEN_STATUS;
    Data: BackendPaymentIntent | null;
};

export const fetchPaymentIntentForExistingV5 = (
    api: Api,
    data: CreatePaymentIntentData,
    signal?: AbortSignal
): Promise<FetchPaymentIntentForExistingV5Response> => {
    return api<FetchPaymentIntentForExistingV5Response>({
        ...createPaymentIntentV5(data),
        signal,
    });
};

export interface GetChargebeeConfigurationResponse {
    Code: number;
    Site: string;
    PublishableKey: string;
    Domain: string;
}

export const getChargebeeConfiguration = () => ({
    url: `payments/v5/web-configuration`,
    method: 'get',
});

// returns the ID. Or is it user's ID? hopefully.
// Call only if ChargebeeEnabled is set to 0 (the system already supports cb but this user was not migrated yet)
// Do not call for signups.
// Do not call if ChargebeeEnabled is undefined.
// If ChargebeeEnabled === 1 then always go to v5 and do not call this.
export const importAccount = () => ({
    url: 'payments/v5/import',
    method: 'post',
});

export const checkImport = () => ({
    url: 'payments/v5/import',
    method: 'head',
});

// no parameter, ideally. Always call before importAccount.
export const cleanupImport = () => ({
    url: 'payments/v5/import',
    method: 'delete',
});

export type GetSubscriptionResponse = {
    Subscription: Subscription;
    UpcomingSubscription?: Subscription;
};

export type GetPaymentMethodsResponse = {
    PaymentMethods: SavedPaymentMethod[];
};
