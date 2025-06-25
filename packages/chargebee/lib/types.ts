export interface CountryEntry {
    label: string;
    value: string;
    disabled: boolean;
}

export interface CountryListSeparator {
    label: string;
    value: string;
    disabled: true;
    type: 'separator';
}

export type Country = CountryEntry | CountryListSeparator;

export interface ChargebeeInstanceConfiguration {
    publishableKey: string;
    site: string;
    domain?: string;
}

export type CardFormRenderMode = 'one-line' | 'two-line';

export type CssVariables = {
    '--signal-danger': string;
    '--border-radius-md': string;
    '--border-norm': string;
    '--focus-outline': string;
    '--focus-ring': string;
    '--field-norm': string;
    '--field-background-color': string;
    '--field-focus-background-color': string;
    '--field-focus-text-color': string;
    '--field-placeholder-color': string;
    '--field-text-color': string;
    '--selection-text-color': string;
    '--selection-background-color': string;
};

export type Translations = {
    cardNumberPlaceholder: string;
    cardExpiryPlaceholder: string;
    cardCvcPlaceholder: string;
    invalidCardNumberMessage: string;
    invalidCardExpiryMessage: string;
    invalidCardCvcMessage: string;
};

export type CbCardConfig = {
    paymentMethodType: 'card';
    renderMode: CardFormRenderMode;
    cssVariables: CssVariables;
    translations: Translations;
} & ChargebeeInstanceConfiguration;

export type ChargebeeCssVariable = keyof CssVariables;
export const chargebeeCssVariables: ChargebeeCssVariable[] = [
    '--signal-danger',
    '--border-radius-md',
    '--border-norm',
    '--focus-outline',
    '--focus-ring',
    '--field-norm',
    '--field-background-color',
    '--field-focus-background-color',
    '--field-focus-text-color',
    '--field-placeholder-color',
    '--field-text-color',
    '--selection-text-color',
    '--selection-background-color',
];

export type CbPaypalConfig = {
    paymentMethodType: 'paypal';
} & ChargebeeInstanceConfiguration;

export type CbSavedCardConfig = {
    paymentMethodType: 'saved-card';
} & ChargebeeInstanceConfiguration;

export type CbDirectDebitConfig = {
    paymentMethodType: 'direct-debit';
} & ChargebeeInstanceConfiguration;

export type CbApplePayConfig = {
    paymentMethodType: 'apple-pay';
} & ChargebeeInstanceConfiguration;

export type CbIframeConfig = CbCardConfig | CbPaypalConfig | CbSavedCardConfig | CbDirectDebitConfig | CbApplePayConfig;

export type PaymentIntent = {
    id: string;
    status: 'inited' | 'authorized';
    amount: number;
    currency_code: string;
    gateway_account_id: string;
    expires_at: number;
    created_at: number;
    modified_at: number;
    updated_at: number;
    resource_version: number;
    object: 'payment_intent';
    gateway: string;
    customer_id: string | null;
    // todo: add SEPA
    payment_method_type: 'card' | 'paypal' | 'apple_pay';
    // Present only for saved payment methods
    reference_id?: string | null;
    email?: string;
};

export interface AuthorizedPaymentIntent extends PaymentIntent {
    status: 'authorized';
    active_payment_attempt: {
        id: string;
        status: 'authorized';
        // todo: add SEPA
        payment_method_type: 'card' | 'paypal' | 'apple_pay';
        id_at_gateway: string;
        created_at: number;
        modified_at: number;
        object: 'payment_attempt';
    };
}

export interface ChargebeeSubmitEventPayload {
    paymentIntent: PaymentIntent;
    countryCode: string;
    zip: string;
}

export interface BinData {
    bin: string;
    last4: string;
}

export function isBinData(obj: any): obj is BinData {
    return (
        obj &&
        typeof obj.bin === 'string' &&
        obj.bin.length === 6 &&
        typeof obj.last4 === 'string' &&
        obj.last4.length === 4
    );
}

export type ChargebeeSubmitEventResponse = {
    authorized: true;
    authorizedPaymentIntent: AuthorizedPaymentIntent;
};

export interface SetPaypalPaymentIntentPayload {
    paymentIntent: PaymentIntent;
}

export const paypalAuthorizedMessageType = 'paypal-authorized';
export type PaypalAuthorizedPayload = {
    paymentIntent: AuthorizedPaymentIntent;
};
export type PaypalAuthorizedMessage = {
    type: typeof paypalAuthorizedMessageType;
} & MessageBusResponseSuccess<PaypalAuthorizedPayload>;

export function isPaypalAuthorizedMessage(obj: any): obj is PaypalAuthorizedMessage {
    return obj && obj.type === paypalAuthorizedMessageType;
}

export type MessageBusResponseSuccess<T> = {
    status: 'success';
    data: T;
};

export type MessageBusResponseFailure = {
    status: 'failure';
    error: any;
    data?: any;
};

export function isMessageBusResponseFailure(obj: any): obj is MessageBusResponseFailure {
    return !!obj && obj.status === 'failure' && !!obj.error;
}

export type MessageBusResponse<T> = MessageBusResponseSuccess<T> | MessageBusResponseFailure;

export type CbIframeResponseStatus = 'success' | 'failure';

export type GetHeightResponsePayload = {
    height: number;
    extraBottom: number;
};
export type GetHeightResponse = MessageBusResponse<GetHeightResponsePayload>;

export const threeDsChallengeMessageType = '3ds-challenge';
export type ThreeDsChallengePayload = {
    url: string;
};

export type ThreeDsChallengeMessage = MessageBusResponseSuccess<ThreeDsChallengePayload> & {
    type: typeof threeDsChallengeMessageType;
};

export function isThreeDsChallengeMessage(obj: any): obj is ThreeDsChallengeMessage {
    return obj && obj.type === threeDsChallengeMessageType;
}

export type FormValidationError = {
    message: string;
    error: string;
};

export type FormValidationErrors = FormValidationError[] | null;

export interface ChargebeeVerifySavedCardEventPayload {
    paymentIntent: PaymentIntent;
}

export const threeDsMessageType = 'chargebee-submit-response';

export type ThreeDsFailedMessage = MessageBusResponseFailure & {
    type: typeof threeDsMessageType;
};

export function isThreeDsFailedMessage(obj: any): obj is ThreeDsFailedMessage {
    return obj && obj.type === threeDsMessageType && obj.status === 'failure';
}

export type ThreeDsSuccessMessage = MessageBusResponseSuccess<PaymentIntent> & {
    type: typeof threeDsMessageType;
};

export function isThreeDsSuccessMessage(obj: any): obj is ThreeDsSuccessMessage {
    return obj && obj.type === threeDsMessageType && obj.status === 'success';
}

export type ChargebeeSavedCardAuthorizationSuccess = {
    authorized: true;
    authorizedPaymentIntent: AuthorizedPaymentIntent;
};

export type ChargebeeSavedCardAuthorizationFailure = {
    authorized: false;
    error: any;
};

export type ThreeDsRequiredForSavedCardMessage = MessageBusResponseSuccess<ThreeDsChallengePayload> & {
    type: typeof threeDsChallengeMessageType;
};

export type SavedCardVerificationSuccessMessage = MessageBusResponseSuccess<ChargebeeSavedCardAuthorizationSuccess> & {
    type: 'chargebee-verify-saved-card-response';
};

export type SavedCardVerificationFailureMessage = MessageBusResponseFailure & {
    type: 'chargebee-verify-saved-card-response';
};

export function isSavedCardVerificationSuccessMessage(obj: any): obj is SavedCardVerificationSuccessMessage {
    return obj && obj.type === 'chargebee-verify-saved-card-response' && obj.status === 'success';
}

export function isSavedCardVerificationFailureMessage(obj: any): obj is SavedCardVerificationFailureMessage {
    return obj && obj.type === 'chargebee-verify-saved-card-response' && obj.status === 'failure';
}

export const paypalFailedMessageType = 'paypal-failed';
export type PaypalFailedMessage = MessageBusResponseFailure & {
    type: typeof paypalFailedMessageType;
};
export function isPaypalFailedMessage(obj: any): obj is PaypalFailedMessage {
    return obj && obj.type === paypalFailedMessageType;
}

export const paypalClickedMessageType = 'paypal-clicked';
export type PaypalClickedMessage = MessageBusResponseSuccess<{}> & {
    type: typeof paypalClickedMessageType;
};
export function isPaypalClickedMessage(obj: any): obj is PaypalClickedMessage {
    return obj && obj.type === paypalClickedMessageType;
}

export const paypalCancelledMessageType = 'paypal-cancelled';
export type PaypalCancelledMessage = MessageBusResponseSuccess<{}> & {
    type: typeof paypalCancelledMessageType;
};
export function isPaypalCancelledMessage(obj: any): obj is PaypalCancelledMessage {
    return obj && obj.type === paypalCancelledMessageType;
}

export const unhandledError = 'chargebee-unhandled-error';
export type UnhandledErrorMessage = MessageBusResponseFailure & {
    type: typeof unhandledError;
};
export function isUnhandledErrorMessage(obj: any): obj is UnhandledErrorMessage {
    return obj && obj.type === unhandledError;
}

// see https://apidocs.chargebee.com/docs/api/error-handling
export const chargebeeValidationErrorName = 'param_wrong_value';

export const paymentAttemptRefusedChargebeeErrorName = 'PAYMENT_ATTEMPT_REFUSED';

export type UpdateFieldsPayload = {
    cssVariables: CssVariables;
};

export type DirectDebitCustomerNameType = 'company' | 'individual';
export interface DirectDebitCustomer {
    email: string;
    company: string;
    firstName: string;
    lastName: string;
    customerNameType: DirectDebitCustomerNameType;
    countryCode: string;
    addressLine1: string;
}

export interface DirectDebitBankAccount {
    iban: string;
}

export interface ChargebeeSubmitDirectDebitEventPayload {
    paymentIntent: PaymentIntent;
    customer: DirectDebitCustomer;
    bankAccount: DirectDebitBankAccount;
}

export const applePayAuthorizedMessageType = 'apple-pay-authorized';
export type ApplePayAuthorizedPayload = {
    paymentIntent: AuthorizedPaymentIntent;
};

export type ApplePayAuthorizedMessage = {
    type: typeof applePayAuthorizedMessageType;
} & MessageBusResponseSuccess<ApplePayAuthorizedPayload>;

export function isApplePayAuthorizedMessage(obj: any): obj is ApplePayAuthorizedMessage {
    return obj && obj.type === applePayAuthorizedMessageType;
}

export const applePayFailedMessageType = 'apple-pay-failed';
export type ApplePayFailedMessage = MessageBusResponseFailure & {
    type: typeof applePayFailedMessageType;
};
export function isApplePayFailedMessage(obj: any): obj is ApplePayFailedMessage {
    return obj && obj.type === applePayFailedMessageType;
}

export type SetApplePayPaymentIntentPayload = {
    paymentIntent: PaymentIntent;
};

export const applePayClickedMessageType = 'apple-pay-clicked';
export type ApplePayClickedMessage = MessageBusResponseSuccess<{}> & {
    type: typeof applePayClickedMessageType;
};
export function isApplePayClickedMessage(obj: any): obj is ApplePayClickedMessage {
    return obj && obj.type === applePayClickedMessageType;
}

export const applePayCancelledMessageType = 'apple-pay-cancelled';
export type ApplePayCancelledMessage = MessageBusResponseSuccess<{}> & {
    type: typeof applePayCancelledMessageType;
};
export function isApplePayCancelledMessage(obj: any): obj is ApplePayCancelledMessage {
    return obj && obj.type === applePayCancelledMessageType;
}

export type GetCanMakePaymentsWithActiveCardResponsePayload = {
    canMakePaymentsWithActiveCard: boolean;
};

export type GetCanMakePaymentsWithActiveCardResponse =
    MessageBusResponseSuccess<GetCanMakePaymentsWithActiveCardResponsePayload>;
