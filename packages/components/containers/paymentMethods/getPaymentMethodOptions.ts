import { c } from 'ttag';
import { isExpired as getIsExpired } from '@proton/shared/lib/helpers/card';
import {
    BLACK_FRIDAY,
    MIN_BITCOIN_AMOUNT,
    MIN_PAYPAL_AMOUNT,
    PAYMENT_METHOD_TYPES,
} from '@proton/shared/lib/constants';
import { PaymentMethod, PaymentMethodStatus } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { PaymentMethodData, PaymentMethodFlows } from './interface';

const getMethod = (paymentMethod: PaymentMethod) => {
    switch (paymentMethod.Type) {
        case PAYMENT_METHOD_TYPES.CARD:
            return `${paymentMethod.Details?.Brand} - ${paymentMethod.Details?.Last4}`;
        case PAYMENT_METHOD_TYPES.PAYPAL:
            return `PayPal - ${paymentMethod.Details?.PayerID}`;
        default:
            return '';
    }
};

const getIcon = (paymentMethod: PaymentMethod) => {
    if (
        paymentMethod.Type === PAYMENT_METHOD_TYPES.PAYPAL ||
        paymentMethod.Type === PAYMENT_METHOD_TYPES.PAYPAL_CREDIT
    ) {
        return 'payments-type-pp';
    }
    if (paymentMethod.Type === PAYMENT_METHOD_TYPES.CARD) {
        switch (paymentMethod.Details.Brand) {
            case 'American Express':
                return 'payments-type-amex';
            case 'Visa':
                return 'payments-type-visa';
            case 'MasterCard':
                return 'payments-type-mastercard';
            default:
                return 'payments-type-card';
        }
    }
    return '';
};

interface Props {
    amount: number;
    coupon: string;
    flow: PaymentMethodFlows;
    paymentMethods?: PaymentMethod[];
    paymentMethodsStatus?: Partial<PaymentMethodStatus>;
}

export const getPaymentMethodOptions = ({
    amount,
    coupon,
    flow,
    paymentMethods = [],
    paymentMethodsStatus = {},
}: Props): PaymentMethodData[] => {
    const isPaypalAmountValid = amount >= MIN_PAYPAL_AMOUNT;
    const isInvoice = flow === 'invoice';
    const isSignup = flow === 'signup';
    const isHumanVerification = flow === 'human-verification';
    const alreadyHavePayPal = paymentMethods.some(({ Type }) => Type === PAYMENT_METHOD_TYPES.PAYPAL);

    return [
        ...paymentMethods
            .filter((paymentMethod) => {
                if (paymentMethod.Type === PAYMENT_METHOD_TYPES.CARD && paymentMethodsStatus?.Card) {
                    return true;
                }
                if (
                    (paymentMethod.Type === PAYMENT_METHOD_TYPES.PAYPAL ||
                        paymentMethod.Type === PAYMENT_METHOD_TYPES.PAYPAL_CREDIT) &&
                    paymentMethodsStatus?.Paypal
                ) {
                    return true;
                }
                return false;
            })
            .map((paymentMethod) => {
                const isExpired =
                    paymentMethod.Type === PAYMENT_METHOD_TYPES.CARD ? getIsExpired(paymentMethod.Details) : false;
                return {
                    icon: getIcon(paymentMethod),
                    text: [getMethod(paymentMethod), isExpired && `(${c('Info').t`Expired`})`]
                        .filter(Boolean)
                        .join(' '),
                    value: paymentMethod.ID,
                    disabled: isExpired,
                    custom: true,
                };
            }),
        paymentMethodsStatus?.Card && {
            icon: 'payments-type-card',
            value: PAYMENT_METHOD_TYPES.CARD,
            text: c('Payment method option').t`New credit/debit card`,
        },
        paymentMethodsStatus?.Paypal &&
            !alreadyHavePayPal &&
            (isPaypalAmountValid || isInvoice) && {
                icon: 'payments-type-pp',
                text: c('Payment method option').t`PayPal`,
                value: PAYMENT_METHOD_TYPES.PAYPAL,
            },
        paymentMethodsStatus?.Bitcoin &&
            !isSignup &&
            !isHumanVerification &&
            coupon !== BLACK_FRIDAY.COUPON_CODE &&
            amount >= MIN_BITCOIN_AMOUNT && {
                icon: 'payments-type-bt',
                text: c('Payment method option').t`Bitcoin`,
                value: PAYMENT_METHOD_TYPES.BITCOIN,
            },
        !isSignup &&
            !isHumanVerification &&
            coupon !== BLACK_FRIDAY.COUPON_CODE && {
                icon: 'payments-type-cash',
                text: c('Label').t`Cash`,
                value: PAYMENT_METHOD_TYPES.CASH,
            },
    ].filter(isTruthy);
};
