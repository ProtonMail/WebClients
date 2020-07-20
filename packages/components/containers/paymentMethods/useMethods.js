import { useEffect, useState } from 'react';
import { c } from 'ttag';
import { useApi, useLoading, useAuthentication } from 'react-components';
import { BLACK_FRIDAY, PAYMENT_METHOD_TYPES, MIN_BITCOIN_AMOUNT, MIN_PAYPAL_AMOUNT } from 'proton-shared/lib/constants';
import { isExpired } from 'proton-shared/lib/helpers/card';
import { queryPaymentMethods } from 'proton-shared/lib/api/payments';

const useMethods = ({ amount, coupon, type }) => {
    const api = useApi();
    const { UID } = useAuthentication();
    const isAuthenticated = !!UID;
    const [methods, setMethods] = useState([]);
    const [loading, withLoading] = useLoading();

    const isPaypalAmountValid = amount >= MIN_PAYPAL_AMOUNT;
    const isInvoice = type === 'invoice';
    const isSignup = type === 'signup';
    const isHumanVerification = type === 'human-verification';
    const alreadyHavePayPal = methods.some(({ Type }) => Type === PAYMENT_METHOD_TYPES.PAYPAL);

    const getMethod = (type, { Brand = '', Last4 = '', Payer = '' }) => {
        switch (type) {
            case PAYMENT_METHOD_TYPES.CARD:
                return `${Brand} - ${Last4}`;
            case PAYMENT_METHOD_TYPES.PAYPAL:
                return `PayPal - ${Payer}`;
            default:
                return '';
        }
    };

    const getIcon = (type, { Brand = '' } = {}) => {
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

    const options = [
        {
            icon: 'payments-type-card',
            value: PAYMENT_METHOD_TYPES.CARD,
            text: c('Payment method option').t`Credit/debit card`,
        },
    ];

    if (methods.length) {
        options.unshift(
            ...methods.map(({ ID: value, Details, Type }) => ({
                icon: getIcon(Type, Details),
                text: [getMethod(Type, Details), isExpired(Details) && `(${c('Info').t`Expired`})`]
                    .filter(Boolean)
                    .join(' '),
                value,
                disabled: isExpired(Details),
            }))
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
            value: 'bitcoin',
        });
    }

    if (!isSignup && !isHumanVerification && coupon !== BLACK_FRIDAY.COUPON_CODE) {
        options.push({
            icon: 'payments-type-cash',
            text: c('Label').t`Cash`,
            value: 'cash',
        });
    }

    useEffect(() => {
        if (isAuthenticated) {
            withLoading(api(queryPaymentMethods()).then(({ PaymentMethods = [] }) => setMethods(PaymentMethods)));
        }
    }, []);

    return {
        methods,
        loading,
        options,
    };
};

export default useMethods;
