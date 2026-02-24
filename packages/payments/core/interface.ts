import type {
    ApplePayAuthorizedPayload,
    BinData,
    CardFormRenderMode,
    ChargebeeSavedCardAuthorizationSuccess,
    ChargebeeSubmitDirectDebitEventPayload,
    ChargebeeSubmitEventPayload,
    ChargebeeSubmitEventResponse,
    ChargebeeVerifySavedCardEventPayload,
    FormValidationErrors,
    GetHeightResponse,
    GooglePayAuthorizedPayload,
    MessageBusResponse,
    MessageBusResponseSuccess,
    PaymentIntent,
    PaypalAuthorizedPayload,
    SetApplePayPaymentIntentPayload,
    SetGooglePayPaymentIntentPayload,
    SetPaypalPaymentIntentPayload,
    ThreeDsChallengePayload,
} from '@proton/chargebee/lib';

import type { CheckSubscriptionData, PaymentsVersion } from './api/api';
import type { BillingAddress, FullBillingAddress } from './billing-address/billing-address';
import type {
    ADDON_NAMES,
    Autopay,
    CURRENCIES,
    CYCLE,
    FREE_SUBSCRIPTION,
    InvoiceState,
    InvoiceType,
    MethodStorage,
    PAYMENT_METHOD_TYPES,
    PAYMENT_TOKEN_STATUS,
    PLANS,
    TransactionState,
    TransactionType,
} from './constants';
import type { PaymentProcessorType } from './payment-processors/interface';
import type { PlansMap } from './plan/interface';
import type { SubscriptionEstimation } from './subscription/interface';

export interface CreateCardDetailsBackend {
    Number: string;
    ExpMonth: string;
    ExpYear: string;
    CVC: string;
    ZIP: string;
    Country: string;
}

export interface CardPayment {
    Type: PAYMENT_METHOD_TYPES.CARD;
    Details: CreateCardDetailsBackend;
}

export interface TokenPayment {
    Type: PAYMENT_METHOD_TYPES.TOKEN;
    Details: {
        Token: string;
    };
}

export type WrappedPaymentsVersion = {
    paymentsVersion: PaymentsVersion;
};

export type WrappedProcessorType = {
    paymentProcessorType: PaymentProcessorType;
    paymentMethodType: PlainPaymentMethodType;
    paymentMethodValue: PaymentMethodType;
};

export type ExtendedTokenPayment = Partial<TokenPayment> & WrappedProcessorType & WrappedPaymentsVersion;

export interface PaypalPayment {
    Type: PAYMENT_METHOD_TYPES.PAYPAL;
}

export interface WrappedPaypalPayment {
    Payment: PaypalPayment;
}

export interface ExistingPayment {
    PaymentMethodID: string;
}

export interface WrappedCardPayment {
    Payment: CardPayment;
}

export interface TokenPaymentMethod {
    Payment: TokenPayment;
}

export type Currency = (typeof CURRENCIES)[number];

export interface AmountAndCurrency {
    Amount: number;
    Currency: Currency;
}

export interface PaymentTokenResult {
    Token: string;
    Status: PAYMENT_TOKEN_STATUS;
    ApprovalURL?: string;
    ReturnHost?: string;
}

export type PlainPaymentMethodType = `${PAYMENT_METHOD_TYPES}`;

export type ChargeablePaymentParameters = Partial<V5PaymentToken> &
    AmountAndCurrency & {
        type:
            | PAYMENT_METHOD_TYPES.PAYPAL
            | PAYMENT_METHOD_TYPES.CARD
            | PAYMENT_METHOD_TYPES.CHARGEBEE_CARD
            | PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL
            | PAYMENT_METHOD_TYPES.BITCOIN
            | PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN
            | PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT
            | PAYMENT_METHOD_TYPES.APPLE_PAY
            | PAYMENT_METHOD_TYPES.GOOGLE_PAY;
        chargeable: true;
    };

export type ChargeablePaymentToken = V5PaymentToken &
    AmountAndCurrency & {
        type:
            | PAYMENT_METHOD_TYPES.PAYPAL
            | PAYMENT_METHOD_TYPES.CARD
            | PAYMENT_METHOD_TYPES.CHARGEBEE_CARD
            | PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL
            | PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT
            | PAYMENT_METHOD_TYPES.APPLE_PAY
            | PAYMENT_METHOD_TYPES.GOOGLE_PAY;
        chargeable: true;
    };

export type NonChargeablePaymentToken = Omit<ChargeablePaymentToken, 'chargeable'> & {
    chargeable: false;
    status: PAYMENT_TOKEN_STATUS;
    returnHost: string;
    approvalURL: string;
};

interface PaymentVendorStates {
    Card: boolean;
    Paypal: boolean;
    Apple: boolean;
    Cash: boolean;
    Bitcoin: boolean;
    Google: boolean;
}

export interface PaymentStatus extends BillingAddress {
    VendorStates: PaymentVendorStates;
}

export interface PayPalDetails {
    BillingAgreementID: string;
    PayerID: string;
    Payer: string;
}

export interface SavedCardDetails {
    /**
     * Even though you can't add the name to the card, it's still returned from the API for old users who already
     * have the card name.
     */
    Name?: string | null;
    ExpMonth: string;
    ExpYear: string;
    ZIP: string;
    Country: string;
    Last4: string;
    Brand: string;
}

export type PaymentMethodCardDetails = {
    Order: number;
    ID: string;
    Type: PAYMENT_METHOD_TYPES.CARD | PAYMENT_METHOD_TYPES.CHARGEBEE_CARD;
    Details: SavedCardDetails;
    Autopay: Autopay;
    External?: MethodStorage;
    IsDefault?: boolean;
};

export type PaymentMethodCardDetailsInternal = {
    Type: PAYMENT_METHOD_TYPES.CARD;
    External?: MethodStorage.INTERNAL;
} & PaymentMethodCardDetails;

export type PaymentMethodCardDetailsExternal = {
    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD;
    External: MethodStorage.EXTERNAL;
} & PaymentMethodCardDetails;

export type PaymentMethodPaypal = {
    Order: number;
    ID: string;
    Type: PAYMENT_METHOD_TYPES.PAYPAL | PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;
    Details: PayPalDetails;
    External?: MethodStorage;
    IsDefault?: boolean;
};

export type PaymentMethodPaypalInternal = {
    Type: PAYMENT_METHOD_TYPES.PAYPAL;
    External?: MethodStorage.INTERNAL;
} & PaymentMethodPaypal;

export type PaymentMethodPaypalExternal = {
    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;
    External: MethodStorage.EXTERNAL;
} & PaymentMethodPaypal;

export type SepaDetails = {
    AccountName: string;
    Country: string;
    Last4: string;
};

export type PaymentMethodSepa = {
    ID: string;
    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT;
    Order: number;
    Autopay: Autopay;
    External?: MethodStorage;
    Details: SepaDetails;
    IsDefault?: boolean;
};

export type PaymentMethodApplePay = {
    ID: string;
    Type: PAYMENT_METHOD_TYPES.APPLE_PAY;
    Order: number;
    Autopay: Autopay;
    External?: MethodStorage;
    Details: SavedCardDetails;
    IsDefault?: boolean;
};

export type PaymentMethodGooglePay = {
    ID: string;
    Type: PAYMENT_METHOD_TYPES.GOOGLE_PAY;
    Order: number;
    Autopay: Autopay;
    External?: MethodStorage.EXTERNAL;
    Details: SavedCardDetails;
    IsDefault?: boolean;
};

export type SavedPaymentMethod =
    | PaymentMethodPaypal
    | PaymentMethodCardDetails
    | PaymentMethodSepa
    | PaymentMethodApplePay
    | PaymentMethodGooglePay;
export type SavedPaymentMethodInternal = PaymentMethodPaypalInternal | PaymentMethodCardDetailsInternal;
export type SavedPaymentMethodExternal =
    | PaymentMethodPaypalExternal
    | PaymentMethodCardDetailsExternal
    | PaymentMethodGooglePay;

export interface LatestSubscription {
    LastSubscriptionEnd: number;
}

export type ExistingPaymentMethod = string;

export type PaymentMethodType = PlainPaymentMethodType | ExistingPaymentMethod;

export interface AvailablePaymentMethod {
    readonly type: PlainPaymentMethodType;
    readonly paymentMethodId?: string; // defined only for existing payment methods
    readonly isExpired?: boolean; // defined only for existing credit cards
    readonly value: PaymentMethodType;
    readonly isSaved: boolean;
    readonly isDefault: boolean;
}

/**
 * Important: Do not change this without contacting the payments team. Do not add new flows, do not remove existing
 * ones. The payment flow has an important role of displaying the payment methods and the tax country selector.
 */
export type PaymentMethodFlow =
    | 'invoice'
    | 'signup'
    | 'signup-pass'
    | 'signup-pass-upgrade'
    | 'signup-wallet'
    | 'signup-v2'
    | 'signup-v2-upgrade'
    | 'signup-vpn'
    | 'credit'
    | 'subscription'
    | 'add-card'
    | 'add-paypal';

export type V5Payments = {
    v: 5;
};

export type V5PaymentToken = {
    PaymentToken: string;
} & V5Payments;

export type ChargeableV5PaymentToken = ChargeablePaymentToken & {
    type:
        | PAYMENT_METHOD_TYPES.CHARGEBEE_CARD
        | PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL
        | PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT
        | PAYMENT_METHOD_TYPES.APPLE_PAY
        | PAYMENT_METHOD_TYPES.GOOGLE_PAY;
};

export type NonChargeableV5PaymentToken = Omit<ChargeableV5PaymentToken, 'chargeable'> & {
    chargeable: false;
};

export type AuthorizedV5PaymentToken = {
    authorized: true;
};

export type NonAuthorizedV5PaymentToken = {
    authorized: false;
    approvalUrl: string;
};

export type ChargeableV5PaymentParameters = ChargeablePaymentParameters & {
    type:
        | PAYMENT_METHOD_TYPES.CHARGEBEE_CARD
        | PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL
        | PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN
        | PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT
        | PAYMENT_METHOD_TYPES.APPLE_PAY
        | PAYMENT_METHOD_TYPES.GOOGLE_PAY;
};

export type ChargebeeFetchedPaymentToken = (ChargeableV5PaymentToken | NonChargeableV5PaymentToken) &
    (AuthorizedV5PaymentToken | NonAuthorizedV5PaymentToken);

export type RequestOptions = {
    signal?: AbortSignal;
    silence?: boolean;
};

type OptimisticFallbackOptions =
    | {
          plansMap: PlansMap;
          optimisticFallback: true;
      }
    | {
          optimisticFallback?: false | never;
      };

export type MultiCheckOptions = {
    cached?: boolean;
} & RequestOptions &
    OptimisticFallbackOptions;

export type GetPlansData = {
    currency?: Currency;
};

export interface PaymentsApi {
    checkSubscription: (
        data: CheckSubscriptionData,
        requestOptions?: RequestOptions
    ) => Promise<SubscriptionEstimation>;

    multiCheck: (data: CheckSubscriptionData[], options?: MultiCheckOptions) => Promise<SubscriptionEstimation[]>;

    cachedCheck: (data: CheckSubscriptionData) => Promise<SubscriptionEstimation>;

    cacheMultiCheck: (data: CheckSubscriptionData, result: SubscriptionEstimation) => void;

    paymentStatus: () => Promise<PaymentStatus>;

    getFullBillingAddress: () => Promise<FullBillingAddress>;
    updateFullBillingAddress: (fullBillingAddress: FullBillingAddress) => Promise<void>;
    updateInvoiceBillingAddress: (invoiceId: string, fullBillingAddress: FullBillingAddress) => Promise<void>;
    getInvoiceBillingAddress: (invoiceId: string) => Promise<FullBillingAddress>;
    getCachedCheck: (data: CheckSubscriptionData) => SubscriptionEstimation | undefined;
    getCachedCheckByPlans: (plans: CheckSubscriptionData['Plans']) => SubscriptionEstimation[];
}

export type RemoveEventListener = () => void;

export type InitializeCreditCardOptions = {
    isNarrow: boolean;
};

export type ChargebeeIframeHandles = {
    submitCreditCard: (
        payload: ChargebeeSubmitEventPayload
    ) => Promise<MessageBusResponseSuccess<ChargebeeSubmitEventResponse>>;
    initializeCreditCard: (props: InitializeCreditCardOptions) => Promise<any>;
    initializeSavedCreditCard: () => Promise<any>;
    validateSavedCreditCard: (
        payload: ChargebeeVerifySavedCardEventPayload
    ) => Promise<MessageBusResponseSuccess<ChargebeeSavedCardAuthorizationSuccess>>;
    initializePaypal: () => Promise<any>;
    setPaypalPaymentIntent: (payload: SetPaypalPaymentIntentPayload, abortSignal: AbortSignal) => Promise<any>;
    getHeight: () => Promise<GetHeightResponse>;
    getBin: () => Promise<MessageBusResponse<BinData | null>>;
    validateCardForm: () => Promise<MessageBusResponse<FormValidationErrors>>;
    changeRenderMode: (renderMode: CardFormRenderMode) => Promise<any>;
    updateFields: () => Promise<any>;
    initializeDirectDebit: () => Promise<any>;
    submitDirectDebit: (payload: ChargebeeSubmitDirectDebitEventPayload) => Promise<MessageBusResponseSuccess<unknown>>;
    setApplePayPaymentIntent: (payload: SetApplePayPaymentIntentPayload, abortSignal: AbortSignal) => Promise<any>;
    initializeApplePay: () => Promise<any>;
    getCanMakePaymentsWithActiveCard: () => Promise<boolean>;
    setGooglePayPaymentIntent: (payload: SetGooglePayPaymentIntentPayload, abortSignal?: AbortSignal) => Promise<any>;
    initializeGooglePay: () => Promise<any>;
};

export type ChargebeeIframeEvents = {
    onPaypalAuthorized: (callback: (payload: PaypalAuthorizedPayload) => any) => RemoveEventListener;
    onPaypalFailure: (callback: (error: any) => any) => RemoveEventListener;
    onPaypalClicked: (callback: () => any) => RemoveEventListener;
    onPaypalCancelled: (callback: () => any) => RemoveEventListener;
    onThreeDsChallenge: (callback: (payload: ThreeDsChallengePayload) => any) => RemoveEventListener;
    onThreeDsSuccess: (callback: (payload: PaymentIntent) => any) => RemoveEventListener;
    onThreeDsFailure: (callback: (error: any) => any) => RemoveEventListener;
    onCardVeririfcationSuccess: (
        callback: (payload: ChargebeeSavedCardAuthorizationSuccess) => any
    ) => RemoveEventListener;
    onCardVeririfcationFailure: (callback: (error: any) => any) => RemoveEventListener;
    onUnhandledError: (
        callback: (error: any, rawError: any, messagePayload: any, checkpoints: any[]) => any
    ) => RemoveEventListener;

    onApplePayAuthorized: (callback: (payload: ApplePayAuthorizedPayload) => any) => RemoveEventListener;
    onApplePayFailure: (callback: (error: any) => any) => RemoveEventListener;
    onApplePayClicked: (callback: () => any) => RemoveEventListener;
    onApplePayCancelled: (callback: () => any) => RemoveEventListener;

    onGooglePayAuthorized: (callback: (payload: GooglePayAuthorizedPayload) => any) => RemoveEventListener;
    onGooglePayFailure: (callback: (error: any) => any) => RemoveEventListener;
    onGooglePayClicked: (callback: () => any) => RemoveEventListener;
    onGooglePayCancelled: (callback: () => any) => RemoveEventListener;
};

export type CryptocurrencyType = 'bitcoin';

export interface CryptoPayment {
    Type: 'cryptocurrency';
    Details: {
        Coin: CryptocurrencyType;
    };
}

export interface WrappedCryptoPayment {
    Payment: CryptoPayment;
}

export interface Invoice {
    ID: string;
    Type: InvoiceType;
    State: InvoiceState;
    Currency: Currency;
    AmountDue: number;
    AmountCharged: number;
    CreateTime: number;
    ModifyTime: number;
    AttemptTime: number;
    Attempts: number;
    IsExternal: boolean;
}

export interface InvoiceResponse {
    Code: number;
    Invoices: Invoice[];
    Total: number;
}

export interface Transaction {
    TransactionID: number;
    ExternalID: string;
    CurrencyCode: Currency;
    Type: TransactionType;
    Amount: number;
    State: TransactionState;
    CreatedAt: string;
}

export interface TransactionResponse {
    Code: number;
    Transactions: Transaction[];
    Total: number;
}

type Quantity = number;

export type PlanIDs = Partial<{
    [planName in PLANS | ADDON_NAMES]: Quantity;
}>;

/**
 * The number of entitlements for the selected plan or addon. For example, `MaxMembers` key shows how many user seats
 * are included with a certain plan or addon.
 */
export type FeatureLimitKey =
    | 'MaxDomains'
    | 'MaxAddresses'
    | 'MaxSpace'
    | 'MaxMembers'
    | 'MaxVPN'
    | 'MaxTier'
    | 'MaxIPs' // synthetic key, it does't exist in the API
    | 'MaxAI' // synthetic key, it does't exist in the API
    | 'MaxLumo';

export type FreeSubscription = typeof FREE_SUBSCRIPTION;

export type Cycle =
    | CYCLE.MONTHLY
    | CYCLE.YEARLY
    | CYCLE.TWO_YEARS
    | CYCLE.THIRTY
    | CYCLE.FIFTEEN
    | CYCLE.THREE
    | CYCLE.EIGHTEEN
    | CYCLE.SIX;

export interface CycleMapping<T> {
    [CYCLE.MONTHLY]?: T;
    [CYCLE.YEARLY]?: T;
    [CYCLE.TWO_YEARS]?: T;
    // Not always included for all plans
    [CYCLE.THIRTY]?: T;
    [CYCLE.FIFTEEN]?: T;
    [CYCLE.THREE]?: T;
    [CYCLE.EIGHTEEN]?: T;
    [CYCLE.SIX]?: T;
}

export type Pricing = CycleMapping<number>;
