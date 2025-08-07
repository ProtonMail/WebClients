import { type ADDON_NAMES, MethodStorage, PAYMENT_METHOD_TYPES, PLANS } from './constants';
import type {
    CardPayment,
    ChargeablePaymentParameters,
    CheckWithAutomaticOptions,
    CreateCardDetailsBackend,
    ExistingPaymentMethod,
    ExtendedTokenPayment,
    FreeSubscription,
    PayPalDetails,
    PaymentMethodApplePay,
    PaymentMethodSepa,
    PaymentMethodType,
    PaypalPayment,
    PlainPaymentMethodType,
    SavedCardDetails,
    SavedPaymentMethod,
    SavedPaymentMethodExternal,
    SavedPaymentMethodInternal,
    SepaDetails,
    TokenPayment,
    TokenPaymentMethod,
    Transaction,
    V5PaymentToken,
    V5Payments,
} from './interface';

export function isCardPayment(payment: CardPayment | undefined): payment is CardPayment {
    return payment?.Type === PAYMENT_METHOD_TYPES.CARD && !!payment?.Details;
}

export function isTokenPayment(
    payment: Omit<ExtendedTokenPayment, 'paymentProcessorType' | 'paymentsVersion'> | undefined
): payment is TokenPayment {
    return payment?.Type === PAYMENT_METHOD_TYPES.TOKEN || !!payment?.Details?.Token;
}

export function isPaypalPayment(payment: any): payment is PaypalPayment {
    return payment && payment.Type === PAYMENT_METHOD_TYPES.PAYPAL;
}

export function isTokenPaymentMethod(data: TokenPaymentMethod | undefined): data is TokenPaymentMethod {
    return !!data && isTokenPayment(data.Payment);
}

export function isPaypalDetails(obj: SavedCardDetails | PayPalDetails | SepaDetails | undefined): obj is PayPalDetails {
    if (!obj) {
        return false;
    }

    const props: (keyof PayPalDetails)[] = ['BillingAgreementID', 'PayerID'];

    return props.every((prop) => typeof obj[prop as keyof typeof obj] === 'string');
}

export function isSavedCardDetails(
    obj: SavedCardDetails | PayPalDetails | SepaDetails | CreateCardDetailsBackend | undefined
): obj is SavedCardDetails {
    if (!obj) {
        return false;
    }

    // Name is optional property, so we don't need to check it here
    const props: (keyof SavedCardDetails)[] = ['ExpMonth', 'ExpYear', 'Country', 'Last4', 'Brand'];

    return props.every((prop) => typeof obj[prop as keyof typeof obj] === 'string');
}

export function isSavedPaymentMethodSepa(obj: SavedPaymentMethod | undefined): obj is PaymentMethodSepa {
    return Boolean(obj && obj.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT && !!obj.Details);
}

export function isSavedPaymentMethodApplePay(obj: SavedPaymentMethod | undefined): obj is PaymentMethodApplePay {
    return !!obj && obj.Type === PAYMENT_METHOD_TYPES.APPLE_PAY && !!obj.Details;
}

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

export function methodMatches(
    method: PaymentMethodType | undefined,
    methods: PlainPaymentMethodType[]
): method is PlainPaymentMethodType {
    if (!method) {
        return false;
    }

    return (methods as string[]).includes(method);
}

export function isExistingPaymentMethod(paymentMethod?: PaymentMethodType): paymentMethod is ExistingPaymentMethod {
    return (
        paymentMethod !== undefined &&
        typeof paymentMethod === 'string' &&
        !methodMatches(paymentMethod, Object.values(PAYMENT_METHOD_TYPES))
    );
}

export function isV5Payments(data: { v?: number } | undefined): data is V5Payments {
    return !!data && data.v === 5;
}

export function isV5PaymentToken(
    data: Omit<ChargeablePaymentParameters, 'Amount' | 'Currency' | 'type' | 'chargeable'>
): data is V5PaymentToken {
    return Boolean(data.PaymentToken && isV5Payments(data));
}

export function isCheckWithAutomaticOptions(data: any): data is CheckWithAutomaticOptions {
    return !!data && !!data.forcedVersion && !!data.reason;
}

export const isValidPlanName = (value: string | PLANS | ADDON_NAMES): value is PLANS =>
    Object.values(PLANS).includes(value as PLANS);

export function isSepaDetails(obj: any): obj is SepaDetails {
    if (!obj) {
        return false;
    }

    const props: (keyof SepaDetails)[] = ['AccountName', 'Country', 'Last4'];

    return props.every((prop) => typeof obj[prop] === 'string');
}

export function isFreeSubscription(obj: any): obj is FreeSubscription {
    return !!obj && obj.isFreeSubscription && Object.keys(obj).filter((key) => obj[key] !== undefined).length === 1;
}

export function isTransaction(obj: any): obj is Transaction {
    return !!obj && !!obj.TransactionID;
}
