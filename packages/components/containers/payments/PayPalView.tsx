import { c } from 'ttag';

import Alert from '@proton/components/components/alert/Alert';
import Price from '@proton/components/components/price/Price';
import { type Currency, PAYMENT_METHOD_TYPES, type PlainPaymentMethodType } from '@proton/payments';
import {
    getMaxCreditAmount,
    getMinPaypalAmountChargebee,
    getMinPaypalAmountInhouse,
} from '@proton/payments/core/amount-limits';

import PayPalInfoMessage from './PayPalInfoMessage';

interface Props {
    amount: number;
    currency: Currency;
    method: PlainPaymentMethodType;
}

const PayPalView = ({ amount, currency, method }: Props) => {
    const isChargebeePaypal = method === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;
    const minAmount = isChargebeePaypal ? getMinPaypalAmountChargebee(currency) : getMinPaypalAmountInhouse(currency);

    if (amount < minAmount) {
        const minimumAmount = (
            <Price currency={currency} key="minimum-amount">
                {minAmount}
            </Price>
        );

        return (
            <Alert className="mb-4" type="error">
                {c('Error').jt`Amount below minimum (${minimumAmount}).`}
            </Alert>
        );
    }

    if (amount > getMaxCreditAmount(currency)) {
        return <Alert className="mb-4" type="error">{c('Error').t`Amount above the maximum.`}</Alert>;
    }

    return (
        <div className="p-4 border rounded bg-weak mb-4" data-testid="paypal-view">
            <PayPalInfoMessage />
        </div>
    );
};

export default PayPalView;
