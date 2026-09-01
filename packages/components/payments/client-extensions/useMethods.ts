import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import type { IconComponent } from '@proton/icons/component';
import { IcBank } from '@proton/icons/icons/IcBank';
import { IcBrandAmex } from '@proton/icons/icons/IcBrandAmex';
import { IcBrandApple } from '@proton/icons/icons/IcBrandApple';
import { IcBrandBitcoin } from '@proton/icons/icons/IcBrandBitcoin';
import { IcBrandDiscover } from '@proton/icons/icons/IcBrandDiscover';
import { IcBrandGoogle } from '@proton/icons/icons/IcBrandGoogle';
import { IcBrandMastercard } from '@proton/icons/icons/IcBrandMastercard';
import { IcBrandPaypal } from '@proton/icons/icons/IcBrandPaypal';
import { IcBrandVisa } from '@proton/icons/icons/IcBrandVisa';
import { IcCreditCard } from '@proton/icons/icons/IcCreditCard';
import { IcMoneyBills } from '@proton/icons/icons/IcMoneyBills';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import { isSignupFlow } from '@proton/payments/core/helpers';
import type {
    AvailablePaymentMethod,
    PaymentMethodFlow,
    SavedPaymentMethod,
    SepaDetails,
} from '@proton/payments/core/interface';
import { IDEAL_WERO_BRAND_NAME } from '@proton/shared/lib/constants';
import { isAndroid, isIos } from '@proton/shared/lib/helpers/browser';
import isTruthy from '@proton/utils/isTruthy';

import useAuthentication from '../../hooks/useAuthentication';
import type { MethodsHook, Props } from '../react-extensions/useMethods';
import { useMethods as _useMethods } from '../react-extensions/useMethods';

export interface ViewPaymentMethod extends AvailablePaymentMethod {
    readonly icon?: IconComponent | undefined;
    readonly text: string;
}

export interface ClientMethodsHook extends MethodsHook {
    usedMethods: ViewPaymentMethod[];
    newMethods: ViewPaymentMethod[];
    allMethods: ViewPaymentMethod[];
    lastUsedMethod: ViewPaymentMethod | undefined;
}

// CHARGEBEE_IDEAL icon is overriden in the paymentMetodSelector
const getIcon = (paymentMethod: SavedPaymentMethod): IconComponent | undefined => {
    if (paymentMethod.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL) {
        return IcBrandPaypal;
    }

    if (paymentMethod.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD) {
        switch (paymentMethod.Details.Brand.toLowerCase()) {
            case 'american express':
                return IcBrandAmex;
            case 'visa':
                return IcBrandVisa;
            case 'mastercard':
                return IcBrandMastercard;
            case 'Discover':
                return IcBrandDiscover;
            default:
                return IcCreditCard;
        }
    }

    if (paymentMethod.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT) {
        return IcBank;
    }

    if (paymentMethod.Type === PAYMENT_METHOD_TYPES.APPLE_PAY) {
        return IcBrandApple;
    }

    if (paymentMethod.Type === PAYMENT_METHOD_TYPES.GOOGLE_PAY) {
        return IcBrandGoogle;
    }
};

const NBSP_HTML = '\u00A0';

export function formattedShortSavedSepaDetails(details: SepaDetails): string {
    const { Country, Last4 } = details;

    return `${Country}${NBSP_HTML}••••${NBSP_HTML}${Last4}`;
}

export function formattedSavedSepaDetails(details: SepaDetails): string {
    const iban = formattedShortSavedSepaDetails(details);
    return `IBAN${NBSP_HTML}${iban}`;
}

const getMethod = (paymentMethod: SavedPaymentMethod): string => {
    switch (paymentMethod.Type) {
        case PAYMENT_METHOD_TYPES.CHARGEBEE_CARD:
            const brand = paymentMethod.Details.Brand;
            const last4 = paymentMethod.Details.Last4;
            // translator: example would be: "Mastercard" ending in "7777"
            return c('new_plans: info').t`${brand} ending in ${last4}`;
        case PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL:
            return `PayPal - ${paymentMethod.Details.PayerID}`;
        case PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL:
        case PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT:
            const details = formattedSavedSepaDetails(paymentMethod.Details);

            return (
                // translator: for example "Bank transfer - IBAN •••• 0000"
                c('Payments.Saved payment method details').t`Bank transfer - ${details}`
            );
        case PAYMENT_METHOD_TYPES.APPLE_PAY:
            // translator: example "Apple Pay - card ending in 1234". Please do not translate brand "Apple Pay".
            return c('Payments.Saved payment method details')
                .t`Apple Pay - card ending in ${paymentMethod.Details.Last4}`;
        case PAYMENT_METHOD_TYPES.GOOGLE_PAY:
            // translator: example "Google Pay - card ending in 1234". Please do not translate brand "Google Pay".
            return c('Payments.Saved payment method details')
                .t`Google Pay - card ending in ${paymentMethod.Details.Last4}`;
        default:
            return '';
    }
};

/**
 * Transform the payment method object from the react-extensions package to a view model that can be used in the UI.
 */
function convertMethod(
    method: AvailablePaymentMethod,
    getSavedMethodById: MethodsHook['getSavedMethodByID'],
    flow: PaymentMethodFlow
): ViewPaymentMethod {
    if (method.paymentMethodId) {
        const savedMethod = getSavedMethodById(method.paymentMethodId) as SavedPaymentMethod;

        return {
            icon: getIcon(savedMethod),
            text: [getMethod(savedMethod), method.isExpired && `(${c('Info').t`Expired`})`].filter(Boolean).join(' '),
            ...method,
        };
    }

    if (method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN) {
        return {
            icon: IcBrandBitcoin,
            text: c('Payment method option').t`Bitcoin`,
            ...method,
        };
    } else if (method.type === PAYMENT_METHOD_TYPES.CASH) {
        return {
            icon: IcMoneyBills,
            text: c('Label').t`Cash`,
            ...method,
        };
    } else if (method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD) {
        return {
            icon: IcCreditCard,
            text: c('Payment method option').t`Credit/debit card`,
            ...method,
        };
    } else if (method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL) {
        return {
            icon: IcBrandPaypal,
            text: c('Payment method option').t`PayPal`,
            ...method,
        };
    } else if (method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT) {
        return {
            icon: IcBank,
            text: c('Payment method option').t`Bank transfer`,
            ...method,
        };
    } else if (method.type === PAYMENT_METHOD_TYPES.APPLE_PAY) {
        return {
            icon: IcBrandApple,
            text: c('Payment method option').t`Apple Pay`,
            ...method,
        };
    } else if (method.type === PAYMENT_METHOD_TYPES.GOOGLE_PAY) {
        return {
            text: c('Payment method option').t`Google Pay`,
            ...method,
        };
    } else if (method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL) {
        return {
            text: `${IDEAL_WERO_BRAND_NAME}`,
            ...method,
        };
    }

    return {
        icon: IcCreditCard,
        text: isSignupFlow(flow)
            ? c('Payment method option').t`Credit/debit card`
            : c('Payment method option').t`New credit/debit card`,
        ...method,
    };
}

/**
 * Enhance the methods hook with client specific data like icons and text.
 * @param methodsHook - output of the useMethods hook from the react-extensions package
 * @param flow – current payment flow. Might modify the text of the payment methods
 * @returns
 */
export const wrapMethods = (methodsHook: MethodsHook, flow: PaymentMethodFlow): ClientMethodsHook => {
    const { getSavedMethodByID, usedMethods, newMethods, allMethods, lastUsedMethod } = methodsHook;

    return {
        ...methodsHook,
        usedMethods: usedMethods.map((method) => convertMethod(method, getSavedMethodByID, flow)),
        newMethods: newMethods.map((method) => convertMethod(method, getSavedMethodByID, flow)),
        allMethods: allMethods.map((method) => convertMethod(method, getSavedMethodByID, flow)),
        lastUsedMethod: lastUsedMethod && convertMethod(lastUsedMethod, getSavedMethodByID, flow),
    };
};

/**
 * A preconfigured version of the useMethods hook from the react-extensions package.
 * Returns view models of methods that can be used in the UI.
 */
export const useMethods = (props: Props): ClientMethodsHook => {
    const api = useApi();
    const { UID } = useAuthentication();
    const isAuthenticated = !!UID;

    const internalResult = _useMethods(props, { api, isAuthenticated });

    return wrapMethods(internalResult, props.flow);
};

export const sortMethodsBasedOnDevice = (availablePaymentMethods: AvailablePaymentMethod[]) => {
    const applePay = availablePaymentMethods.find(({ type }) => type === PAYMENT_METHOD_TYPES.APPLE_PAY);
    const googlePay = availablePaymentMethods.find(({ type }) => type === PAYMENT_METHOD_TYPES.GOOGLE_PAY);
    const everythingElse = availablePaymentMethods.filter(
        ({ type }) => type !== PAYMENT_METHOD_TYPES.APPLE_PAY && type !== PAYMENT_METHOD_TYPES.GOOGLE_PAY
    );

    let sortedPaymentMethods: (AvailablePaymentMethod | undefined)[] = availablePaymentMethods;
    if (isIos()) {
        sortedPaymentMethods = [applePay, ...everythingElse, googlePay];
    } else if (isAndroid()) {
        sortedPaymentMethods = [googlePay, ...everythingElse, applePay];
    }
    return sortedPaymentMethods.filter(isTruthy);
};
