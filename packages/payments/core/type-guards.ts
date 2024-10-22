import { MethodStorage, PAYMENT_METHOD_TYPES, PLANS } from './constants';
import type {
    CardPayment,
    CheckWithAutomaticOptions,
    ExistingPaymentMethod,
    ExtendedTokenPayment,
    PayPalDetails,
    PaymentMethodSepa,
    PaymentMethodStatusExtended,
    PaymentMethodType,
    PaypalPayment,
    PlainPaymentMethodType,
    SavedCardDetails,
    SavedPaymentMethod,
    SavedPaymentMethodExternal,
    SavedPaymentMethodInternal,
    TokenPayment,
    TokenPaymentMethod,
    V5PaymentToken,
    V5Payments,
    WrappedPaymentsVersion,
    WrappedProcessorType,
} from './interface';

export function isCardPayment(payment: any): payment is CardPayment {
    return payment?.Type === PAYMENT_METHOD_TYPES.CARD && !!payment?.Details;
}
export function isTokenPayment(payment: any): payment is TokenPayment {
    return payment?.Type === PAYMENT_METHOD_TYPES.TOKEN || !!(payment as any)?.Details?.Token;
}
export function isWrappedPaymentsVersion(data: any): data is WrappedPaymentsVersion {
    return !!data && !!data.paymentsVersion;
}
export function isWrappedProcessorType(data: any): data is WrappedProcessorType {
    return !!data && !!data.paymentProcessorType;
}
export function isExtendedTokenPayment(data: any): data is ExtendedTokenPayment {
    return isWrappedProcessorType(data) && isWrappedPaymentsVersion(data);
}
export function isPaypalPayment(payment: any): payment is PaypalPayment {
    return (
        payment && (payment.Type === PAYMENT_METHOD_TYPES.PAYPAL || payment.Type === PAYMENT_METHOD_TYPES.PAYPAL_CREDIT)
    );
}
export function isTokenPaymentMethod(data: any): data is TokenPaymentMethod {
    return !!data && isTokenPayment(data.Payment);
}
export function isPaymentMethodStatusExtended(obj: any): obj is PaymentMethodStatusExtended {
    if (!obj) {
        return false;
    }

    return !!obj.VendorStates;
}

export function isPaypalDetails(obj: any): obj is PayPalDetails {
    if (!obj) {
        return false;
    }

    const props: (keyof PayPalDetails)[] = ['BillingAgreementID', 'PayerID'];

    return props.every((prop) => typeof obj[prop] === 'string');
}
export function isSavedCardDetails(obj: any): obj is SavedCardDetails {
    if (!obj) {
        return false;
    }

    // Name is optional property, so we don't need to check it here
    const props: (keyof SavedCardDetails)[] = ['ExpMonth', 'ExpYear', 'Country', 'Last4', 'Brand'];

    return props.every((prop) => typeof obj[prop] === 'string');
}

export function isSavedPaymentMethodSepa(obj: any): obj is PaymentMethodSepa {
    return obj.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT && !!obj.Details;
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

export function isV5Payments(data: any): data is V5Payments {
    return !!data && data.v === 5;
}

export function isV5PaymentToken(data: any): data is V5PaymentToken {
    return data.PaymentToken && isV5Payments(data);
}

export function isCheckWithAutomaticOptions(data: any): data is CheckWithAutomaticOptions {
    return !!data && !!data.forcedVersion && !!data.reason;
}

export const isStringPLAN = (value: string): value is PLANS => Object.values(PLANS).includes(value as PLANS);
