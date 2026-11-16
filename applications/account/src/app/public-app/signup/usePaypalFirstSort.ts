import { useStaticExperiment } from '@proton/account/staticExperiments/useStaticExperiment';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { AvailablePaymentMethod } from '@proton/payments/core/interface';

export const sortPaypalFirst = (methods: AvailablePaymentMethod[]) => {
    const paypal = methods.find(({ type }) => type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL);
    return paypal ? [paypal, ...methods.filter((method) => method !== paypal)] : methods;
};

/**
 * Returns the `sortNewMethods` option for `usePaymentFacade`: PayPal first for users in the `with` variant of the
 * `PaypalFirst` static experiment, the default order otherwise.
 */
export const usePaypalFirstSort = () => {
    const paypalFirstVariant = useStaticExperiment('PaypalFirst');
    return paypalFirstVariant === 'with' ? sortPaypalFirst : undefined;
};
