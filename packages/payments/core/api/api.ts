import type { Api, User } from '@proton/shared/lib/interfaces';
import formatSubscription from '@proton/shared/lib/subscription/format';
import { isAdmin, isPaid } from '@proton/shared/lib/user/helpers';

import type { BillingAddress } from '../billing-address/billing-address';
import type {
    Autopay,
    InvoiceOwner,
    InvoiceState,
    InvoiceType,
    PAYMENT_METHOD_TYPES,
    PAYMENT_TOKEN_STATUS,
} from '../constants';
import { PLAN_TYPES } from '../constants';
import type {
    AmountAndCurrency,
    ChargeablePaymentParameters,
    Currency,
    Cycle,
    ExistingPayment,
    PaymentStatus,
    PlanIDs,
    SavedPaymentMethod,
    TokenPayment,
    TokenPaymentMethod,
    V5PaymentToken,
    WrappedCardPayment,
    WrappedCryptoPayment,
    WrappedPaypalPayment,
} from '../interface';
import { formatPaymentMethods } from '../methods';
import { normalizePaymentMethodStatus } from '../payment-status';
import { PlanState } from '../plan/constants';
import type { FreePlanDefault, SubscriptionPlan } from '../plan/interface';
import type { Renew } from '../subscription/constants';
import { FREE_PLAN } from '../subscription/freePlans';
import type { Subscription } from '../subscription/interface';

const queryPaymentMethodStatus = () => ({
    url: `payments/v5/status`,
    method: 'get',
});

export async function getPaymentMethodStatus(api: Api) {
    const result = await api<PaymentStatus>(queryPaymentMethodStatus());
    return normalizePaymentMethodStatus(result);
}

export type PaymentsVersion = 'v4' | 'v5';
let paymentsVersion: PaymentsVersion = 'v5';

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

export interface FeedbackDowngradeData {
    Reason: string;
    Feedback: string;
    ReasonDetails: string;
    Context: 'vpn' | 'mail';
}

export const deleteSubscription = (data: FeedbackDowngradeData, version: PaymentsVersion) => ({
    url: `payments/${version}/subscription`,
    method: 'delete',
    data,
});

export enum ProrationMode {
    Default = 0,
    Exact = 1,
}

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
    ProrationMode?: ProrationMode;
    IsTrial?: boolean;
    ValidateZipCode?: boolean;
    VatId?: string;
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
    Owner: InvoiceOwner;
    State?: InvoiceState;
    Type?: InvoiceType;
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

export const getInvoicePDF = (invoiceID: string, version: PaymentsVersion) => ({
    url: `payments/${version}/invoices/${invoiceID}`,
    method: 'get',
    output: 'arrayBuffer',
});

export const getTransactionPDF = (transactionID: string | number) => ({
    url: `payments/v5/invoices/TX-${transactionID}`,
    method: 'get',
    output: 'arrayBuffer',
});

export const checkInvoice = (invoiceID: string, version?: PaymentsVersion, GiftCode?: string) => ({
    url: `payments/${version ?? paymentsVersion}/invoices/${invoiceID}/check`,
    method: 'put',
    data: { GiftCode },
});

export const queryPaymentMethod = (methodID: string, forceVersion?: PaymentsVersion) => ({
    url: `payments/${forceVersion ?? paymentsVersion}/methods/${methodID}`,
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

export const getLatestCancelledSubscription = () => ({
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

export const changeRenewState = (data: RenewalStateData) => ({
    url: `payments/v5/subscription/renew`,
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

export type CreatePaymentIntentDirectDebitData = AmountAndCurrency & {
    Payment: {
        Type: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT;
    };
};

export type CreatePaymentIntentApplePayData = AmountAndCurrency & {
    Payment: {
        Type: PAYMENT_METHOD_TYPES.APPLE_PAY;
    };
};

export type CreatePaymentIntentGooglePayData = AmountAndCurrency & {
    Payment: {
        Type: PAYMENT_METHOD_TYPES.GOOGLE_PAY;
    };
};

export type CreatePaymentIntentData =
    | CreatePaymentIntentPaypalData
    | CreatePaymentIntentCardData
    | CreatePaymentIntentSavedCardData
    | CreatePaymentIntentDirectDebitData
    | CreatePaymentIntentApplePayData
    | CreatePaymentIntentGooglePayData;

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
    PaymentMethodType: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
    CreatedAt: number;
    ModifiedAt: number;
    UpdatedAt: number;
    ResourceVersion: number;
    Object: 'payment_intent';
    CustomerID: string | null;
    CurrencyCode: Currency;
    Gateway: string;
    ReferenceID: string | null;
    Email?: string;
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

export type GetSubscriptionResponse = {
    Subscription: Subscription;
    UpcomingSubscription?: Subscription;
};

export type GetPaymentMethodsResponse = {
    PaymentMethods: SavedPaymentMethod[];
};

export interface QueryTransactionsParams {
    Page: number;
    PageSize: number;
    Owner: InvoiceOwner;
}

export const queryTransactions = (params: QueryTransactionsParams) => ({
    url: `payments/v5/transactions`,
    method: 'get',
    params,
});

// Do not export this function. Use getPaymentMethods instead.
const queryPaymentMethods = () => ({
    url: `payments/v5/methods`,
    method: 'get',
});

export async function getPaymentMethods(api: Api): Promise<SavedPaymentMethod[]> {
    const response = await api<{ PaymentMethods: SavedPaymentMethod[] }>(queryPaymentMethods());
    return formatPaymentMethods(response.PaymentMethods ?? []);
}

export function markPaymentMethodAsDefault(api: Api, methodID: string, methods: SavedPaymentMethod[]): Promise<void> {
    const IDs = methods.map(({ ID }) => ID);
    const index = methods.findIndex(({ ID }) => ID === methodID);
    IDs.splice(index, 1);
    IDs.unshift(methodID);
    return api(orderPaymentMethods(IDs, 'v5'));
}

const addSubscriptionPlan = (subscription: Subscription): Subscription => {
    if (!subscription) {
        return subscription;
    }

    const subscriptionPlan: SubscriptionPlan = {
        Amount: subscription.Amount,
        Currency: subscription.Currency,
        Cycle: subscription.Cycle,
        Features: 0,
        ID: `dummy-id-${subscription.ID}`,
        Name: (subscription as any).Name,
        Type: PLAN_TYPES.PLAN,
        State: PlanState.Available,
        Services: 0,
        Title: (subscription as any).Title,
        MaxDomains: 0,
        MaxAddresses: 0,
        MaxSpace: 0,
        MaxCalendars: 0,
        MaxMembers: 0,
        MaxVPN: 0,
        MaxTier: 0,
        Quantity: 1,
    };

    return {
        ...subscription,
        Plans: [subscriptionPlan],
    };
};

export const querySubscriptionV5DynamicPlans = () => ({
    url: `payments/v5/subscription?no-redirect=1`,
    method: 'get',
});

const getSubscriptionV5DynamicPlans = async (api: Api) => {
    // Please note that this api actually DOES NOT return the proper Subscription objects.
    // The response is very close to Subscription type, but not completely. The most significant problems:
    // - Upcoming subscriptions must be manually linked to their parents
    // - The Plans array doesn't exists and addons are not supported. Because of this, the new v5 response
    // can be used only in limited capacity.
    const { Subscriptions, UpcomingSubscriptions } = await api<{
        Subscriptions: Subscription[];
        UpcomingSubscriptions: Subscription[];
    }>(querySubscriptionV5DynamicPlans());

    return Subscriptions.map((subscription) => {
        const upcomingSubscription = UpcomingSubscriptions.find(
            (it: any) => it.ParentSubscriptionID === subscription.ID
        );

        return formatSubscription(
            addSubscriptionPlan(subscription),
            addSubscriptionPlan(upcomingSubscription as Subscription),
            undefined
        );
    });
};

const canFetchSecondarySubscriptions = (user: User) => {
    return isAdmin(user) && isPaid(user) && user.HasMultipleSubscriptions;
};

export const getSubscription = async (api: Api, user: User | undefined) => {
    const primarySubscriptionPromise = api<{
        Subscription: Subscription;
        UpcomingSubscription: Subscription;
    }>({
        url: `payments/v5/subscription`,
        method: 'get',
    });

    const secondarySubscriptionsPromise =
        user && canFetchSecondarySubscriptions(user)
            ? getSubscriptionV5DynamicPlans(api).catch(() => undefined)
            : undefined;

    const [{ Subscription, UpcomingSubscription }, secondarySubscriptions] = await Promise.all([
        primarySubscriptionPromise,
        secondarySubscriptionsPromise,
    ]);

    const filteredSecondarySubscriptions = secondarySubscriptions?.filter((it) => it.ID !== Subscription.ID);

    return formatSubscription(
        Subscription,
        UpcomingSubscription,
        filteredSecondarySubscriptions && filteredSecondarySubscriptions.length > 0
            ? filteredSecondarySubscriptions
            : undefined
    );
};
