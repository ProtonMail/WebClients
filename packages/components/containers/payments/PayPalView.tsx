import { c } from 'ttag';

import Alert from '@proton/components/components/alert/Alert';
import type { PaymentMethodFlows, PlainPaymentMethodType } from '@proton/components/payments/core';
import { PAYMENT_METHOD_TYPES } from '@proton/components/payments/core';
import type { PaypalProcessorHook } from '@proton/components/payments/react-extensions/usePaypal';
import {
    MAX_PAYPAL_AMOUNT,
    MIN_PAYPAL_AMOUNT_CHARGEBEE,
    MIN_PAYPAL_AMOUNT_INHOUSE,
} from '@proton/shared/lib/constants';
import type { Currency } from '@proton/shared/lib/interfaces';

import { Price } from '../../components';
import PayPalButton from './PayPalButton';
import PayPalInfoMessage from './PayPalInfoMessage';

interface Props {
    paypal: PaypalProcessorHook;
    paypalCredit: PaypalProcessorHook;
    type?: PaymentMethodFlows;
    amount: number;
    currency: Currency;
    disabled?: boolean;
    prefetchToken?: boolean;
    onClick?: () => void;
    triggersDisabled?: boolean;
    showPaypalCredit: boolean;
    method: PlainPaymentMethodType;
}

const PayPalView = ({
    type,
    amount,
    currency,
    paypalCredit,
    disabled,
    prefetchToken,
    onClick,
    triggersDisabled,
    showPaypalCredit,
    method,
}: Props) => {
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

    const clickHere = (
        <PayPalButton
            id="paypal-credit"
            data-testid="paypal-credit-button"
            shape="outline"
            color="norm"
            flow={type}
            key="click-here"
            size="small"
            paypal={paypalCredit}
            amount={amount}
            disabled={disabled || paypalCredit.isInitialState || triggersDisabled}
            prefetchToken={prefetchToken}
            currency={currency}
            onClick={onClick}
            loading={paypalCredit.processingToken}
        >
            {c('Link').t`click here`}
        </PayPalButton>
    );

    return (
        <div className="p-4 border rounded bg-weak mb-4" data-testid="paypal-view">
            <PayPalInfoMessage />
            {showPaypalCredit ? (
                <>
                    <div className="mt-4 mb-4">
                        {c('Info')
                            .t`You must have a credit card or bank account linked with your PayPal account. If your PayPal account doesn't have that, please click on the button below.`}
                    </div>
                    <div>{clickHere}</div>
                </>
            ) : null}
        </div>
    );
};

export default PayPalView;
