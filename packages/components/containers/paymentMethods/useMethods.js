import { useEffect, useState } from 'react';
import { c } from 'ttag';
import { useApi, useLoading, useAuthentication } from 'react-components';
import { BLACK_FRIDAY, PAYMENT_METHOD_TYPES, MIN_BITCOIN_AMOUNT } from 'proton-shared/lib/constants';
import { isExpired } from 'proton-shared/lib/helpers/card';
import { queryPaymentMethods } from 'proton-shared/lib/api/payments';

const useMethods = ({ amount, coupon, type }) => {
    const api = useApi();
    const { UID } = useAuthentication();
    const isAuthenticated = !!UID;
    const [methods, setMethods] = useState([]);
    const [loading, withLoading] = useLoading();

    const isPaypalAmountValid = amount >= 500;
    const isInvoice = type === 'invoice';
    const isSignup = type === 'signup';
    const alreadyHavePayPal = methods.some(({ Type }) => Type === PAYMENT_METHOD_TYPES.PAYPAL);

    const getMethod = (type, { Brand = '', Last4 = '', Payer = '' }) => {
        switch (type) {
            case PAYMENT_METHOD_TYPES.CARD:
                return `[${Brand}] •••• ${Last4}`;
            case PAYMENT_METHOD_TYPES.PAYPAL:
                return `[PayPal] ${Payer}`;
            default:
                return '';
        }
    };

    const options = [
        {
            value: PAYMENT_METHOD_TYPES.CARD,
            text: c('Payment method option').t`Pay with credit/debit card`
        }
    ];

    if (methods.length) {
        options.unshift(
            ...methods.map(({ ID: value, Details, Type }, index) => ({
                text: [
                    getMethod(Type, Details),
                    isExpired(Details) && `(${c('Info').t`Expired`})`,
                    index === 0 && `(${c('Info').t`default`})`
                ]
                    .filter(Boolean)
                    .join(' '),
                value,
                disabled: isExpired(Details)
            }))
        );
    }

    if (!alreadyHavePayPal && (isPaypalAmountValid || isInvoice)) {
        options.push({
            text: c('Payment method option').t`Pay with PayPal`,
            value: PAYMENT_METHOD_TYPES.PAYPAL
        });
    }

    if (!isSignup && coupon !== BLACK_FRIDAY.COUPON_CODE) {
        if (amount >= MIN_BITCOIN_AMOUNT) {
            options.push({
                text: c('Payment method option').t`Pay with Bitcoin`,
                value: 'bitcoin'
            });
        }

        options.push({
            text: c('Label').t`Pay with cash`,
            value: 'cash'
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
        options
    };
};

export default useMethods;
