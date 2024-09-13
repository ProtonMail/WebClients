import type {
    BinData,
    CardFormRenderMode,
    ChargebeeSavedCardAuthorizationSuccess,
    ChargebeeSubmitEventPayload,
    ChargebeeSubmitEventResponse,
    ChargebeeVerifySavedCardEventPayload,
    FormValidationErrors,
    GetHeightResponse,
    MessageBusResponse,
    MessageBusResponseSuccess,
    PaymentIntent,
    PaypalAuthorizedPayload,
    SetPaypalPaymentIntentPayload,
    ThreeDsChallengePayload,
} from '@proton/chargebee/lib';
import type { PaymentProcessorType } from '@proton/components/payments/react-extensions/interface';
import type { CheckSubscriptionData, PaymentsVersion } from '@proton/shared/lib/api/payments';
import type { Currency, SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';

import type { Autopay, MethodStorage, PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from './constants';

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
};

export type ExtendedTokenPayment = Partial<TokenPayment> & WrappedProcessorType & WrappedPaymentsVersion;

export interface PaypalPayment {
    Type: PAYMENT_METHOD_TYPES.PAYPAL | PAYMENT_METHOD_TYPES.PAYPAL_CREDIT;
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
            | PAYMENT_METHOD_TYPES.PAYPAL_CREDIT
            | PAYMENT_METHOD_TYPES.CARD
            | PAYMENT_METHOD_TYPES.CHARGEBEE_CARD
            | PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL
            | PAYMENT_METHOD_TYPES.BITCOIN
            | PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN;
        chargeable: true;
    };

export type ChargeablePaymentToken = V5PaymentToken &
    AmountAndCurrency & {
        type:
            | PAYMENT_METHOD_TYPES.PAYPAL
            | PAYMENT_METHOD_TYPES.PAYPAL_CREDIT
            | PAYMENT_METHOD_TYPES.CARD
            | PAYMENT_METHOD_TYPES.CHARGEBEE_CARD
            | PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;
        chargeable: true;
    };

export type NonChargeablePaymentToken = Omit<ChargeablePaymentToken, 'chargeable'> & {
    chargeable: false;
    status: PAYMENT_TOKEN_STATUS;
    returnHost: string;
    approvalURL: string;
};

export interface PaymentMethodStatus {
    Card: boolean;
    Paypal: boolean;
    Apple: boolean;
    Cash: boolean;
    Bitcoin: boolean;
}

export interface PaymentMethodStatusExtended {
    CountryCode: string;
    State?: string | null;
    VendorStates: PaymentMethodStatus;
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
};

export type PaymentMethodPaypalInternal = {
    Type: PAYMENT_METHOD_TYPES.PAYPAL;
    External?: MethodStorage.INTERNAL;
} & PaymentMethodPaypal;

export type PaymentMethodPaypalExternal = {
    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;
    External: MethodStorage.EXTERNAL;
} & PaymentMethodPaypal;

export type SavedPaymentMethod = PaymentMethodPaypal | PaymentMethodCardDetails;
export type SavedPaymentMethodInternal = PaymentMethodPaypalInternal | PaymentMethodCardDetailsInternal;
export type SavedPaymentMethodExternal = PaymentMethodPaypalExternal | PaymentMethodCardDetailsExternal;

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
}

export type PaymentMethodFlows =
    | 'invoice'
    | 'signup'
    | 'signup-pass'
    | 'signup-pass-upgrade'
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
    type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD | PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;
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
        | PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN;
};

export type ChargebeeFetchedPaymentToken = (ChargeableV5PaymentToken | NonChargeableV5PaymentToken) &
    (AuthorizedV5PaymentToken | NonAuthorizedV5PaymentToken);

export type CheckWithAutomaticOptions = {
    forcedVersion: PaymentsVersion;
    reason: string;
    silence?: boolean;
};

export type MultiCheckSubscriptionData = CheckSubscriptionData & (CheckWithAutomaticOptions | {});

export type RequestOptions = {
    signal?: AbortSignal;
    silence?: boolean;
};

export type MultiCheckOptions = {
    cached?: boolean;
} & RequestOptions;

export type GetPlansData = {
    currency?: Currency;
};

export interface PaymentsApi {
    checkWithAutomaticVersion: (
        data: CheckSubscriptionData,
        requestOptions?: RequestOptions,
        options?: CheckWithAutomaticOptions
    ) => Promise<SubscriptionCheckResponse>;

    multiCheck: (
        data: MultiCheckSubscriptionData[],
        options?: MultiCheckOptions
    ) => Promise<SubscriptionCheckResponse[]>;

    cacheMultiCheck: (
        data: CheckSubscriptionData,
        options: CheckWithAutomaticOptions | undefined,
        result: SubscriptionCheckResponse
    ) => void;

    statusExtendedAutomatic: () => Promise<PaymentMethodStatusExtended>;
}

export type ChargebeeKillSwitchData = {
    reason: string;
    data?: any;
    error?: any;
};
export type ChargebeeKillSwitch = (data?: ChargebeeKillSwitchData) => boolean;
export type ForceEnableChargebee = () => void;

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
};

export type ChargebeeIframeEvents = {
    onPaypalAuthorized: (callback: (payload: PaypalAuthorizedPayload) => any) => RemoveEventListener;
    onPaypalFailure: (callback: (error: any) => any) => RemoveEventListener;
    onPaypalClicked: (callback: () => any) => RemoveEventListener;
    onPaypalCancelled: (callback: () => any) => RemoveEventListener;
    onThreeDsChallenge: (callback: (payload: ThreeDsChallengePayload) => any) => RemoveEventListener;
    onThreeDsSuccess: (callback: (payload: PaymentIntent) => any) => RemoveEventListener;
    onThreeDsFailure: (callback: (error: any) => any) => RemoveEventListener;
    onCardVeririfcation3dsChallenge: (callback: (payload: ThreeDsChallengePayload) => any) => RemoveEventListener;
    onCardVeririfcationSuccess: (
        callback: (payload: ChargebeeSavedCardAuthorizationSuccess) => any
    ) => RemoveEventListener;
    onCardVeririfcationFailure: (callback: (error: any) => any) => RemoveEventListener;
    onUnhandledError: (
        callback: (error: any, rawError: any, messagePayload: any, checkpoints: any[]) => any
    ) => RemoveEventListener;
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
