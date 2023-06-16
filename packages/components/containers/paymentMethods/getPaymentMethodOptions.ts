import { c } from 'ttag';

import {
    PAYMENT_METHOD_TYPES,
    PaymentMethodStatus,
    SavedPaymentMethod,
    isExpired as getIsExpired,
} from '@proton/components/payments/core';
import { BLACK_FRIDAY, MIN_BITCOIN_AMOUNT, MIN_PAYPAL_AMOUNT } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import { IconName } from '../../components';
import { PaymentMethodData, PaymentMethodFlows } from './interface';

const getMethod = (paymentMethod: SavedPaymentMethod) => {
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

interface Props {
    amount: number;
    coupon: string;
    flow: PaymentMethodFlows;
    paymentMethods?: SavedPaymentMethod[];
    paymentMethodsStatus?: Partial<PaymentMethodStatus>;
}

export const getPaymentMethodOptions = ({
    amount,
    coupon,
    flow,
    paymentMethods = [],
    paymentMethodsStatus = {},
}: Props): { usedMethods: PaymentMethodData[]; methods: PaymentMethodData[] } => {
    const isPaypalAmountValid = amount >= MIN_PAYPAL_AMOUNT;
    const isInvoice = flow === 'invoice';
    const isPassSignup = flow === 'signup-pass';
    const isRegularSignup = flow === 'signup';
    const isSignup = isRegularSignup || isPassSignup;
    const isHumanVerification = flow === 'human-verification';
    const alreadyHavePayPal = paymentMethods.some(({ Type }) => Type === PAYMENT_METHOD_TYPES.PAYPAL);

    const usedMethods = paymentMethods
        .filter((paymentMethod) => {
            if (paymentMethod.Type === PAYMENT_METHOD_TYPES.CARD && paymentMethodsStatus?.Card) {
                return true;
            }
            if (paymentMethod.Type === PAYMENT_METHOD_TYPES.PAYPAL && paymentMethodsStatus?.Paypal) {
                return true;
            }
            return false;
        })
        .map((paymentMethod) => {
            const isExpired =
                paymentMethod.Type === PAYMENT_METHOD_TYPES.CARD ? getIsExpired(paymentMethod.Details) : false;
            return {
                icon: getIcon(paymentMethod),
                text: [getMethod(paymentMethod), isExpired && `(${c('Info').t`Expired`})`].filter(Boolean).join(' '),
                value: paymentMethod.ID,
                disabled: isExpired,
                custom: true,
            };
        });

    const methods = [
        paymentMethodsStatus?.Card && {
            icon: 'credit-card' as const,
            value: PAYMENT_METHOD_TYPES.CARD,
            text: isSignup
                ? c('Payment method option').t`Credit/debit card`
                : c('Payment method option').t`New credit/debit card`,
        },
        paymentMethodsStatus?.Paypal &&
            !alreadyHavePayPal &&
            (isPaypalAmountValid || isInvoice) && {
                icon: 'brand-paypal' as const,
                text: c('Payment method option').t`PayPal`,
                value: PAYMENT_METHOD_TYPES.PAYPAL,
            },
        paymentMethodsStatus?.Bitcoin &&
            !isRegularSignup &&
            !isHumanVerification &&
            coupon !== BLACK_FRIDAY.COUPON_CODE &&
            amount >= MIN_BITCOIN_AMOUNT && {
                icon: 'brand-bitcoin' as const,
                text: c('Payment method option').t`Bitcoin`,
                value: PAYMENT_METHOD_TYPES.BITCOIN,
            },
        !isSignup &&
            !isHumanVerification &&
            coupon !== BLACK_FRIDAY.COUPON_CODE && {
                icon: 'money-bills' as const,
                text: c('Label').t`Cash`,
                value: PAYMENT_METHOD_TYPES.CASH,
            },
    ].filter(isTruthy);

    return {
        usedMethods,
        methods,
    };
};
