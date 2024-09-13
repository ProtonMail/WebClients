import { c } from 'ttag';

import { type IconName } from '@proton/components/components/icon/Icon';

import { useApi, useAuthentication } from '../../hooks';
import type {
    AvailablePaymentMethod,
    PaymentMethodFlows,
    SavedPaymentMethod} from '../core';
import {
    PAYMENT_METHOD_TYPES,
    isSignupFlow,
} from '../core';
import type { MethodsHook, Props} from '../react-extensions/useMethods';
import { useMethods as _useMethods } from '../react-extensions/useMethods';

export interface ViewPaymentMethod extends AvailablePaymentMethod {
    readonly icon: IconName | undefined;
    readonly text: string;
}

interface ClientMethodsHook extends MethodsHook {
    usedMethods: ViewPaymentMethod[];
    newMethods: ViewPaymentMethod[];
    allMethods: ViewPaymentMethod[];
    lastUsedMethod: ViewPaymentMethod | undefined;
}

const getIcon = (paymentMethod: SavedPaymentMethod): IconName | undefined => {
    if (
        paymentMethod.Type === PAYMENT_METHOD_TYPES.PAYPAL ||
        paymentMethod.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL
    ) {
        return 'brand-paypal';
    }

    if (
        paymentMethod.Type === PAYMENT_METHOD_TYPES.CARD ||
        paymentMethod.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD
    ) {
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
        case PAYMENT_METHOD_TYPES.CHARGEBEE_CARD:
            const brand = paymentMethod.Details.Brand;
            const last4 = paymentMethod.Details.Last4;
            // translator: example would be: "Mastercard" ending in "7777"
            return c('new_plans: info').t`${brand} ending in ${last4}`;
        case PAYMENT_METHOD_TYPES.PAYPAL:
        case PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL:
            return `PayPal - ${paymentMethod.Details.PayerID}`;
        default:
            return '';
    }
};

/**
 * Transform the payment method object from the react-extensions package to a view model that can be used in the UI.
 */
export function convertMethod(
    method: AvailablePaymentMethod,
    getSavedMethodById: MethodsHook['getSavedMethodByID'],
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

    if (method.type === PAYMENT_METHOD_TYPES.PAYPAL || method.type === PAYMENT_METHOD_TYPES.PAYPAL_CREDIT) {
        return {
            icon: 'brand-paypal' as const,
            text: c('Payment method option').t`PayPal`,
            ...method,
        };
    } else if (method.type === PAYMENT_METHOD_TYPES.BITCOIN || method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN) {
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
    } else if (method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD) {
        return {
            icon: 'credit-card' as const,
            text: c('Payment method option').t`Credit/debit card`,
            ...method,
        };
    } else if (method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL) {
        return {
            icon: 'brand-paypal' as const,
            text: c('Payment method option').t`PayPal`,
            ...method,
        };
    }

    return {
        icon: 'credit-card' as const,
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
export const wrapMethods = (methodsHook: MethodsHook, flow: PaymentMethodFlows): ClientMethodsHook => {
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
