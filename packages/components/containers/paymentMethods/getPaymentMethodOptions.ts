import { c } from 'ttag';
import { isExpired } from 'proton-shared/lib/helpers/card';
import {
    BLACK_FRIDAY,
    MIN_BITCOIN_AMOUNT,
    MIN_PAYPAL_AMOUNT,
    PAYMENT_METHOD_TYPE,
    PAYMENT_METHOD_TYPES,
} from 'proton-shared/lib/constants';
import { PaymentMethodResult } from '../payments/interface';
import { PaymentMethodData, PaymentMethodFlows } from './interface';

const getMethod = (type: PAYMENT_METHOD_TYPE, { Brand = '', Last4 = '', Payer = '' }: any = {}) => {
    switch (type) {
        case PAYMENT_METHOD_TYPES.CARD:
            return `${Brand} - ${Last4}`;
        case PAYMENT_METHOD_TYPES.PAYPAL:
            return `PayPal - ${Payer}`;
        default:
            return '';
    }
};

const getIcon = (type: PAYMENT_METHOD_TYPE, { Brand = '' }: any = {}) => {
    switch (Brand || type) {
        case 'American Express':
            return 'payments-type-amex';
        case 'Visa':
            return 'payments-type-visa';
        case 'Discover':
            return 'payments-type-discover';
        case 'MasterCard':
            return 'payments-type-mastercard';
        case PAYMENT_METHOD_TYPES.CARD:
            return 'payments-type-card';
        case PAYMENT_METHOD_TYPES.PAYPAL:
            return 'payments-type-pp';
        default:
            return '';
    }
};

interface Props {
    amount: number;
    coupon: string;
    type: PaymentMethodFlows;
    methods?: PaymentMethodResult[];
}

export const getPaymentMethodOptions = ({ amount, coupon, type, methods = [] }: Props) => {
    const isPaypalAmountValid = amount >= MIN_PAYPAL_AMOUNT;
    const isInvoice = type === 'invoice';
    const isSignup = type === 'signup';
    const isHumanVerification = type === 'human-verification';
    const alreadyHavePayPal = methods.some(({ Type }) => Type === PAYMENT_METHOD_TYPES.PAYPAL);

    const options: PaymentMethodData[] = [
        {
            icon: 'payments-type-card',
            value: PAYMENT_METHOD_TYPES.CARD,
            text: c('Payment method option').t`Credit/debit card`,
        },
    ];

    if (methods.length) {
        options.unshift(
            ...methods.map(({ ID: value, Details, Type }) => {
                const disabled = 'ExpMonth' in Details ? isExpired(Details) : false;
                return {
                    icon: getIcon(Type, Details),
                    text: [getMethod(Type, Details), disabled && `(${c('Info').t`Expired`})`].filter(Boolean).join(' '),
                    value,
                    disabled,
                };
            })
        );
    }

    if (!alreadyHavePayPal && (isPaypalAmountValid || isInvoice)) {
        options.push({
            icon: 'payments-type-pp',
            text: c('Payment method option').t`PayPal`,
            value: PAYMENT_METHOD_TYPES.PAYPAL,
        });
    }

    if (!isSignup && !isHumanVerification && coupon !== BLACK_FRIDAY.COUPON_CODE && amount >= MIN_BITCOIN_AMOUNT) {
        options.push({
            icon: 'payments-type-bt',
            text: c('Payment method option').t`Bitcoin`,
            value: PAYMENT_METHOD_TYPES.BITCOIN,
        });
    }

    if (!isSignup && !isHumanVerification && coupon !== BLACK_FRIDAY.COUPON_CODE) {
        options.push({
            icon: 'payments-type-cash',
            text: c('Label').t`Cash`,
            value: PAYMENT_METHOD_TYPES.CASH,
        });
    }

    return options;
};
