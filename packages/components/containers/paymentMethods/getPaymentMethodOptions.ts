import { c } from 'ttag';
import { isExpired } from 'proton-shared/lib/helpers/card';
import { BLACK_FRIDAY, MIN_BITCOIN_AMOUNT, MIN_PAYPAL_AMOUNT, PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';
import { PaymentMethod, PaymentMethodStatus } from 'proton-shared/lib/interfaces';
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
            case 'Discover':
                return 'payments-type-discover';
            case 'MasterCard':
                return 'payments-type-mastercard';
            default:
                return 'payments-type-card';
        }
    }
    return '';
};

// TODO: Merge PR with api request
const defaultStatus: PaymentMethodStatus = {
    Card: true,
    Paypal: true,
    Apple: true,
    Cash: true,
    Bitcoin: true,
};

interface Props {
    amount: number;
    coupon: string;
    type: PaymentMethodFlows;
    methods?: PaymentMethod[];
    status?: PaymentMethodStatus;
}

export const getPaymentMethodOptions = ({ amount, coupon, type, methods = [], status = defaultStatus }: Props) => {
    const isPaypalAmountValid = amount >= MIN_PAYPAL_AMOUNT;
    const isInvoice = type === 'invoice';
    const isSignup = type === 'signup';
    const isHumanVerification = type === 'human-verification';
    const alreadyHavePayPal = methods.some(({ Type }) => Type === PAYMENT_METHOD_TYPES.PAYPAL);

    const options: PaymentMethodData[] = [];

    if (status?.Card) {
        options.push({
            icon: 'payments-type-card',
            value: PAYMENT_METHOD_TYPES.CARD,
            text: c('Payment method option').t`New credit/debit card`,
        });
    }

    if (methods.length) {
        options.unshift(
            ...methods
                .filter((paymentMethod) => {
                    if (paymentMethod.Type === PAYMENT_METHOD_TYPES.CARD && status?.Card) {
                        return true;
                    }
                    if (
                        (paymentMethod.Type === PAYMENT_METHOD_TYPES.PAYPAL ||
                            paymentMethod.Type === PAYMENT_METHOD_TYPES.PAYPAL_CREDIT) &&
                        status?.Paypal
                    ) {
                        return true;
                    }
                    return false;
                })
                .map((paymentMethod) => {
                    const expired =
                        paymentMethod.Type === PAYMENT_METHOD_TYPES.CARD ? isExpired(paymentMethod.Details) : false;
                    return {
                        icon: getIcon(paymentMethod),
                        text: [getMethod(paymentMethod), expired && `(${c('Info').t`Expired`})`]
                            .filter(Boolean)
                            .join(' '),
                        value: paymentMethod.ID,
                        disabled: expired,
                    };
                })
        );
    }

    if (status?.Paypal && !alreadyHavePayPal && (isPaypalAmountValid || isInvoice)) {
        options.push({
            icon: 'payments-type-pp',
            text: c('Payment method option').t`PayPal`,
            value: PAYMENT_METHOD_TYPES.PAYPAL,
        });
    }

    if (
        status?.Bitcoin &&
        !isSignup &&
        !isHumanVerification &&
        coupon !== BLACK_FRIDAY.COUPON_CODE &&
        amount >= MIN_BITCOIN_AMOUNT
    ) {
        options.push({
            icon: 'payments-type-bt',
            text: c('Payment method option').t`Bitcoin`,
            value: PAYMENT_METHOD_TYPES.BITCOIN,
        });
    }

    if (status?.Cash && !isSignup && !isHumanVerification && coupon !== BLACK_FRIDAY.COUPON_CODE) {
        options.push({
            icon: 'payments-type-cash',
            text: c('Label').t`Cash`,
            value: PAYMENT_METHOD_TYPES.CASH,
        });
    }

    return options;
};
