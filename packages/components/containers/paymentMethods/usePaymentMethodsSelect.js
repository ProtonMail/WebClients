import { c } from 'ttag';
import { useApiResult } from 'react-components';
import { CYCLE, BLACK_FRIDAY, PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';
import { queryPaymentMethods } from 'proton-shared/lib/api/payments';
import { isIE11 } from 'proton-shared/lib/helpers/browser';
import { isExpired } from 'proton-shared/lib/helpers/card';

const usePaymentMethodsSelect = ({ amount, cycle, coupon, type }) => {
    const { result = {}, loading } = useApiResult(queryPaymentMethods, []);
    const { PaymentMethods = [] } = result;
    const isMonthlyValid = amount > 5000 && cycle === CYCLE.MONTHLY;
    const isYearly = cycle === CYCLE.YEARLY;
    const isTwoYear = cycle === CYCLE.TWO_YEARS;
    const isInvoice = type === 'invoice';
    const isSignup = type === 'signup';

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

    const methods = [
        {
            value: PAYMENT_METHOD_TYPES.CARD,
            text: c('Payment method option').t`Pay with credit/debit card`
        }
    ];

    if (PaymentMethods.length) {
        methods.unshift(
            ...PaymentMethods.map(({ ID: value, Details, Type }, index) => ({
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

    // Paypal doesn't work with IE11
    if (!isIE11() && (isYearly || isTwoYear || isMonthlyValid || isInvoice)) {
        methods.push({
            text: c('Payment method option').t`Pay with PayPal`,
            value: PAYMENT_METHOD_TYPES.PAYPAL
        });
    }

    if (!isSignup && coupon !== BLACK_FRIDAY.COUPON_CODE) {
        methods.push({
            text: c('Payment method option').t`Pay with Bitcoin`,
            value: 'bitcoin'
        });

        methods.push({
            text: c('Label').t`Pay with cash`,
            value: 'cash'
        });
    }

    return {
        methods,
        loading
    };
};

export default usePaymentMethodsSelect;
