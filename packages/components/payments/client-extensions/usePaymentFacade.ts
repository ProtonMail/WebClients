import { useEffect } from 'react';

import {
    getDefaultVerifyPayment,
    getDefaultVerifyPaypal,
} from '@proton/components/containers/payments/usePaymentToken';
import { Currency } from '@proton/shared/lib/interfaces';

import { useApi, useAuthentication, useModals } from '../../hooks';
import { ChargeablePaymentParameters, PAYMENT_METHOD_TYPES, PaymentMethodFlows, PaymentMethodType } from '../core';
import { Operations, usePaymentFacade as useInnerPaymentFacade } from '../react-extensions';
import { wrapMethods } from './useMethods';

export const usePaymentFacade = ({
    amount,
    currency,
    onChargeable,
    coupon,
    flow,
}: {
    amount: number;
    currency: Currency;
    onChargeable: (
        operations: Operations,
        data: ChargeablePaymentParameters,
        source: PaymentMethodType
    ) => Promise<unknown>;
    coupon?: string;
    flow: PaymentMethodFlows;
}) => {
    const api = useApi();
    const { createModal } = useModals();
    const { UID } = useAuthentication();
    const isAuthenticated = !!UID;

    const hook = useInnerPaymentFacade(
        {
            amount,
            currency,
            onChargeable,
            coupon,
            flow,
        },
        {
            api,
            isAuthenticated,
            verifyPaymentPaypal: getDefaultVerifyPaypal(createModal, api),
            verifyPayment: getDefaultVerifyPayment(createModal, api),
        }
    );

    const methods = wrapMethods(hook.methods, flow);

    const userCanTrigger = {
        [PAYMENT_METHOD_TYPES.BITCOIN]: false,
        [PAYMENT_METHOD_TYPES.CARD]: true,
        [PAYMENT_METHOD_TYPES.CASH]: false,
        [PAYMENT_METHOD_TYPES.PAYPAL]: true,
        [PAYMENT_METHOD_TYPES.PAYPAL_CREDIT]: true,
        [PAYMENT_METHOD_TYPES.TOKEN]: false,
    };

    const userCanTriggerSelected = methods.selectedMethod?.type ? userCanTrigger[methods.selectedMethod.type] : false;

    /**
     * The longer I looked at this construction in its previous reincarnation, the more I was puzzled about it.
     * Interestingly enough, it crystalized again during the refactoring of payments, so it might be the only
     * way to make it work.
     * This construction makes possible rendering PayPal and PayPal Credit buttons at the same time.
     * - We must pre-fetch the payment token, otherwise we won't be able to open the payment verification tab
     *     in Safari (as of 16.5, both Desktop and Mobile). The tab can be opened only as a result of
     *     synchronous handler of the click.
     * - We can't prefetch the tokens inside the Paypal and Paypal Credit buttons, because Captcha must go
     *     one after another.
     * - We can't put this overall logic into the lower levels (react-extensions or core), because it depends
     *     on the view and app-specific assumptions.
     */
    useEffect(() => {
        if (hook.methods.isNewPaypal) {
            hook.paypal.fetchPaymentToken().then(() => hook.paypalCredit.fetchPaymentToken());
        }
    }, [hook.methods.isNewPaypal, amount, currency]);

    return {
        ...hook,
        methods,
        api,
        userCanTrigger,
        userCanTriggerSelected,
    };
};
