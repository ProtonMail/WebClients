import {
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
import { CheckSubscriptionData, PaymentsVersion } from '@proton/shared/lib/api/payments';
import { Currency, SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';

import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from './constants';

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

export function isCardPayment(payment: any): payment is CardPayment {
    return payment?.Type === PAYMENT_METHOD_TYPES.CARD && !!payment?.Details;
}

export interface TokenPayment {
    Type: PAYMENT_METHOD_TYPES.TOKEN;
    Details: {
        Token: string;
    };
}

export type TokenPaymentWithPaymentsVersion = Partial<TokenPayment> & {
    paymentsVersion: PaymentsVersion;
};

export function isTokenPayment(payment: any): payment is TokenPayment {
    return payment?.Type === PAYMENT_METHOD_TYPES.TOKEN || !!(payment as any)?.Details?.Token;
}

export interface PaypalPayment {
    Type: PAYMENT_METHOD_TYPES.PAYPAL | PAYMENT_METHOD_TYPES.PAYPAL_CREDIT;
}

export interface WrappedPaypalPayment {
    Payment: PaypalPayment;
}

export function isPaypalPayment(payment: any): payment is PaypalPayment {
    return (
        payment && (payment.Type === PAYMENT_METHOD_TYPES.PAYPAL || payment.Type === PAYMENT_METHOD_TYPES.PAYPAL_CREDIT)
    );
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

export function isTokenPaymentMethod(data: any): data is TokenPaymentMethod {
    return !!data && isTokenPayment(data.Payment);
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

export type BillingAddress = {
    CountryCode: string;
    State?: string | null;
};

export type BillingAddressProperty = {
    BillingAddress: BillingAddress;
};

export type ChargeablePaymentParameters = Partial<V5PaymentToken> &
    AmountAndCurrency & {
        type:
            | PAYMENT_METHOD_TYPES.PAYPAL
            | PAYMENT_METHOD_TYPES.PAYPAL_CREDIT
            | PAYMENT_METHOD_TYPES.CARD
            | PAYMENT_METHOD_TYPES.CHARGEBEE_CARD
            | PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;
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
    CountryCode?: string | null;
    ZipCode?: string | null;
    State?: string | null;
    VendorStates: PaymentMethodStatus;
}

export function isPaymentMethodStatusExtended(obj: any): obj is PaymentMethodStatusExtended {
    if (!obj) {
        return false;
    }

    return !!obj.VendorStates;
}

export function extendStatus(status: PaymentMethodStatus | PaymentMethodStatusExtended): PaymentMethodStatusExtended {
    if (!isPaymentMethodStatusExtended(status)) {
        return {
            VendorStates: status,
        };
    }

    return status;
}

export interface PayPalDetails {
    BillingAgreementID: string;
    PayerID: string;
    Payer: string;
}

export function isPaypalDetails(obj: any): obj is PayPalDetails {
    if (!obj) {
        return false;
    }

    const props: (keyof PayPalDetails)[] = ['BillingAgreementID', 'PayerID'];

    return props.every((prop) => typeof obj[prop] === 'string');
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

export function isSavedCardDetails(obj: any): obj is SavedCardDetails {
    if (!obj) {
        return false;
    }

    // Name is optional property, so we don't need to check it here
    const props: (keyof SavedCardDetails)[] = ['ExpMonth', 'ExpYear', 'Country', 'Last4', 'Brand'];

    return props.every((prop) => typeof obj[prop] === 'string');
}

export enum Autopay {
    DISABLE = 0,
    ENABLE = 1,
}

export enum MethodStorage {
    INTERNAL = 0,
    EXTERNAL = 1,
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

export function isSavedPaymentMethodInternal(
    paymentMethod?: SavedPaymentMethod
): paymentMethod is SavedPaymentMethodInternal {
    return (
        paymentMethod?.External === MethodStorage.INTERNAL || (!!paymentMethod && paymentMethod.External === undefined)
    );
}

export function isSavedPaymentMethodExternal(
    paymentMethod?: SavedPaymentMethod
): paymentMethod is SavedPaymentMethodExternal {
    return paymentMethod?.External === MethodStorage.EXTERNAL;
}

export interface LatestSubscription {
    LastSubscriptionEnd: number;
}

export function methodMatches(
    method: PaymentMethodType | undefined,
    methods: PlainPaymentMethodType[]
): method is PlainPaymentMethodType {
    if (!method) {
        return false;
    }

    return (methods as string[]).includes(method);
}

export type ExistingPaymentMethod = string;

export function isExistingPaymentMethod(paymentMethod?: PaymentMethodType): paymentMethod is ExistingPaymentMethod {
    return (
        paymentMethod !== undefined &&
        typeof paymentMethod === 'string' &&
        !methodMatches(paymentMethod, Object.values(PAYMENT_METHOD_TYPES))
    );
}

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
    | 'signup-vpn'
    | 'credit'
    | 'subscription'
    | 'add-card'
    | 'add-paypal';

export type V5Payments = {
    v: 5;
};

export function isV5Payments(data: any): data is V5Payments {
    return !!data && data.v === 5;
}

export type V5PaymentToken = {
    PaymentToken: string;
} & V5Payments;

export function isV5PaymentToken(data: any): data is V5PaymentToken {
    return data.PaymentToken && isV5Payments(data);
}

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
    type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD | PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;
};

export type ChargebeeFetchedPaymentToken = (ChargeableV5PaymentToken | NonChargeableV5PaymentToken) &
    (AuthorizedV5PaymentToken | NonAuthorizedV5PaymentToken);

export interface PaymentsApi {
    checkWithAutomaticVersion: (
        data: CheckSubscriptionData,
        signal?: AbortSignal
    ) => Promise<SubscriptionCheckResponse>;
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
    onUnhandledError: (callback: (error: any, rawError: any, messagePayload: any) => any) => RemoveEventListener;
};
