import { c } from 'ttag';

import type { IconComponent } from '@proton/icons/component';
import { IcCreditCard } from '@proton/icons/icons/IcCreditCard';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import { isSignupFlow } from '@proton/payments/core/helpers';
import type { AvailablePaymentMethod, PaymentMethodFlow, SavedPaymentMethod } from '@proton/payments/core/interface';
import { isAndroid, isIos } from '@proton/shared/lib/helpers/browser';
import isTruthy from '@proton/utils/isTruthy';

import { getPaymentMethodUi, getSavedMethodUi } from '../payment-methods/paymentMethodUiRegistry';
import type { MethodsHook } from '../react-extensions/useMethods';

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

const getIcon = ({ Type, Details }: SavedPaymentMethod): IconComponent | undefined =>
    getSavedMethodUi(Type)?.savedMethodIcon?.(Details);

const getMethod = ({ Type, Details }: SavedPaymentMethod): string =>
    getSavedMethodUi(Type)?.savedMethodLabel?.(Details) ?? '';

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

    const newMethodView = getPaymentMethodUi(method.type)?.newMethodView?.();
    if (newMethodView) {
        return { ...newMethodView, ...method };
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
