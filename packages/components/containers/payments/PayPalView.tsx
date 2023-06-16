import { c } from 'ttag';

import { PaypalProcessorHook, isPaypalProcessorHook } from '@proton/components/payments/react-extensions/usePaypal';
import { MAX_PAYPAL_AMOUNT, MIN_PAYPAL_AMOUNT } from '@proton/shared/lib/constants';
import { doNotWindowOpen } from '@proton/shared/lib/helpers/browser';
import { Currency } from '@proton/shared/lib/interfaces';

import { Alert, DoNotWindowOpenAlertError, Price } from '../../components';
import { PaymentMethodFlows } from '../paymentMethods/interface';
import PayPalButton from './PayPalButton';
import PayPalInfoMessage from './PayPalInfoMessage';
import { PayPalHook } from './usePayPal';

interface Props {
    paypal: PayPalHook | PaypalProcessorHook;
    paypalCredit: PayPalHook | PaypalProcessorHook;
    type?: PaymentMethodFlows;
    amount: number;
    currency: Currency;
    disabled?: boolean;
    prefetchToken?: boolean;
    onClick?: () => void;
}

const PayPalView = ({ type, amount, currency, paypalCredit, disabled, prefetchToken, onClick }: Props) => {
    if (amount < MIN_PAYPAL_AMOUNT) {
        return (
            <Alert className="mb-4" type="error">
                {c('Error').t`Amount below minimum.`} {`(${(<Price currency={currency}>{MIN_PAYPAL_AMOUNT}</Price>)})`}
            </Alert>
        );
    }

    if (amount > MAX_PAYPAL_AMOUNT) {
        return <Alert className="mb-4" type="error">{c('Error').t`Amount above the maximum.`}</Alert>;
    }

    if (doNotWindowOpen()) {
        return <DoNotWindowOpenAlertError />;
    }

    const clickHere = isPaypalProcessorHook(paypalCredit) ? (
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
            disabled={disabled || !paypalCredit.tokenFetched}
            prefetchToken={prefetchToken}
            currency={currency}
            onClick={onClick}
            loading={paypalCredit.processingToken}
        >
            {c('Link').t`click here`}
        </PayPalButton>
    ) : (
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
            disabled={disabled}
            prefetchToken={prefetchToken}
            loading={paypalCredit.loadingVerification}
        >
            {c('Link').t`click here`}
        </PayPalButton>
    );

    const allowedPaymentTypes: PaymentMethodFlows[] = ['signup', 'signup-pass', 'subscription', 'invoice', 'credit'];
    const isAllowedPaymentType = type && allowedPaymentTypes.includes(type);

    const allowedOtherTypes: PaymentMethodFlows[] = ['donation', 'human-verification'];
    const isAllowedOtherType = type && allowedOtherTypes.includes(type);

    return (
        <div className="p-4 border rounded bg-weak mb-4" data-testid="paypal-view">
            {isAllowedPaymentType ? (
                <>
                    <PayPalInfoMessage />
                    <div className="mb-4">
                        {c('Info')
                            .t`You must have a credit card or bank account linked with your PayPal account. If your PayPal account doesn't have that, please click on the button below.`}
                        <br />
                        {clickHere}
                    </div>
                </>
            ) : null}
            {isAllowedOtherType ? <PayPalInfoMessage /> : null}
        </div>
    );
};

export default PayPalView;
