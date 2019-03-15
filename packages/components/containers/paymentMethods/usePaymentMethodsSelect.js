import { c } from 'ttag';
import { useApiResult } from 'react-components';
import { CYCLE, BLACK_FRIDAY } from 'proton-shared/lib/constants';
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

    const cardNumber = (details) => {
        return `[${details.Brand}] •••• ${details.Last4} ${isExpired(details) ? `(${c('Info').t`Expired`})` : ''}`;
    };

    const methods = [
        {
            value: 'card',
            text: c('Payment method option').t`Add new credit card`
        }
    ];

    if (PaymentMethods.length) {
        methods.unshift(
            ...PaymentMethods.map(({ ID: value, Details }) => ({
                text: cardNumber(Details),
                value,
                disabled: isExpired(Details)
            }))
        );
    }

    // Paypal doesn't work with IE11
    if (!isIE11() && (isYearly || isTwoYear || isMonthlyValid || isInvoice)) {
        methods.push({
            text: 'PayPal',
            value: 'paypal'
        });
    }

    if (!isSignup && coupon !== BLACK_FRIDAY.COUPON_CODE) {
        methods.push({
            text: 'Bitcoin',
            value: 'bitcoin'
        });

        methods.push({
            text: c('Label').t`Cash`,
            value: 'cash'
        });
    }

    return {
        methods,
        loading
    };
};

export default usePaymentMethodsSelect;
