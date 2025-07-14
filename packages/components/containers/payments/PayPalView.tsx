import { c } from 'ttag';

import Alert from '@proton/components/components/alert/Alert';
import Price from '@proton/components/components/price/Price';
import {
    type Currency,
    MAX_PAYPAL_AMOUNT,
    MIN_PAYPAL_AMOUNT_CHARGEBEE,
    MIN_PAYPAL_AMOUNT_INHOUSE,
    PAYMENT_METHOD_TYPES,
    type PlainPaymentMethodType,
} from '@proton/payments';

import PayPalInfoMessage from './PayPalInfoMessage';

interface Props {
    amount: number;
    currency: Currency;
    method: PlainPaymentMethodType;
}

const PayPalView = ({ amount, currency, method }: Props) => {
    const isChargebeePaypal = method === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;
    const minAmount = isChargebeePaypal ? MIN_PAYPAL_AMOUNT_CHARGEBEE : MIN_PAYPAL_AMOUNT_INHOUSE;

    if (amount < minAmount) {
        const minimumAmount = <Price currency={currency}>{minAmount}</Price>;

        return (
            <Alert className="mb-4" type="error">
                {c('Error').jt`Amount below minimum (${minimumAmount}).`}
            </Alert>
        );
    }

    if (amount > MAX_PAYPAL_AMOUNT) {
        return <Alert className="mb-4" type="error">{c('Error').t`Amount above the maximum.`}</Alert>;
    }

    return (
        <div className="p-4 border rounded bg-weak mb-4" data-testid="paypal-view">
            <PayPalInfoMessage />
        </div>
    );
};

export default PayPalView;
