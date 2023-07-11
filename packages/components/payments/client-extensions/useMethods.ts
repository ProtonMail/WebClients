import { c } from 'ttag';

import { IconName } from '../../components/icon';
import { useApi, useAuthentication } from '../../hooks';
import { AvailablePaymentMethod, PAYMENT_METHOD_TYPES, PaymentMethodFlows, SavedPaymentMethod } from '../core';
import { Props, MethodsHook as _Result, useMethods as _useMethods } from '../react-extensions/useMethods';

export interface ViewPaymentMethod extends AvailablePaymentMethod {
    readonly icon: IconName | undefined;
    readonly text: string;
}

interface ClientMethodsHook extends _Result {
    usedMethods: ViewPaymentMethod[];
    newMethods: ViewPaymentMethod[];
    allMethods: ViewPaymentMethod[];
    lastUsedMethod: ViewPaymentMethod | undefined;
}

const getIcon = (paymentMethod: SavedPaymentMethod): IconName | undefined => {
    if (paymentMethod.Type === PAYMENT_METHOD_TYPES.PAYPAL) {
        return 'brand-paypal';
    }

    if (paymentMethod.Type === PAYMENT_METHOD_TYPES.CARD) {
        switch (paymentMethod.Details.Brand.toLowerCase()) {
            case 'american express':
                return 'brand-amex';
            case 'visa':
                return 'brand-visa';
            case 'mastercard':
                return 'brand-mastercard';
            case 'Discover':
                return 'brand-discover';
            default:
                return 'credit-card';
        }
    }
};

const getMethod = (paymentMethod: SavedPaymentMethod): string => {
    switch (paymentMethod.Type) {
        case PAYMENT_METHOD_TYPES.CARD:
            const brand = paymentMethod.Details.Brand;
            const last4 = paymentMethod.Details.Last4;
            // translator: example would be: "Mastercard" ending in "7777"
            return c('new_plans: info').t`${brand} ending in ${last4}`;
        case PAYMENT_METHOD_TYPES.PAYPAL:
            return `PayPal - ${paymentMethod.Details.PayerID}`;
        default:
            return '';
    }
};

export function convertMethod(
    method: AvailablePaymentMethod,
    getSavedMethodById: _Result['getSavedMethodByID'],
    flow: PaymentMethodFlows
): ViewPaymentMethod {
    if (method.paymentMethodId) {
        const savedMethod = getSavedMethodById(method.paymentMethodId) as SavedPaymentMethod;
        return {
            icon: getIcon(savedMethod),
            text: [getMethod(savedMethod), method.isExpired && `(${c('Info').t`Expired`})`].filter(Boolean).join(' '),
            ...method,
        };
    }

    const isSignup = flow === 'signup' || flow === 'signup-pass';

    if (method.type === PAYMENT_METHOD_TYPES.PAYPAL || method.type === PAYMENT_METHOD_TYPES.PAYPAL_CREDIT) {
        return {
            icon: 'brand-paypal' as const,
            text: c('Payment method option').t`PayPal`,
            ...method,
        };
    } else if (method.type === PAYMENT_METHOD_TYPES.BITCOIN) {
        return {
            icon: 'brand-bitcoin' as const,
            text: c('Payment method option').t`Bitcoin`,
            ...method,
        };
    } else if (method.type === PAYMENT_METHOD_TYPES.CASH) {
        return {
            icon: 'money-bills' as const,
            text: c('Label').t`Cash`,
            ...method,
        };
    }

    return {
        icon: 'credit-card' as const,
        text: isSignup
            ? c('Payment method option').t`Credit/debit card`
            : c('Payment method option').t`New credit/debit card`,
        ...method,
    };
}

export const wrapMethods = (result: _Result, flow: PaymentMethodFlows): ClientMethodsHook => {
    const { getSavedMethodByID, usedMethods, newMethods, allMethods, lastUsedMethod } = result;

    return {
        ...result,
        usedMethods: usedMethods.map((method) => convertMethod(method, getSavedMethodByID, flow)),
        newMethods: newMethods.map((method) => convertMethod(method, getSavedMethodByID, flow)),
        allMethods: allMethods.map((method) => convertMethod(method, getSavedMethodByID, flow)),
        lastUsedMethod: lastUsedMethod && convertMethod(lastUsedMethod, getSavedMethodByID, flow),
    };
};

export const useMethods = (props: Props): ClientMethodsHook => {
    const api = useApi();
    const { UID } = useAuthentication();
    const isAuthenticated = !!UID;

    const internalResult = _useMethods(props, { api, isAuthenticated });

    return wrapMethods(internalResult, props.flow);
};
