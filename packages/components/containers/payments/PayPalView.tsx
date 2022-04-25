import { MIN_PAYPAL_AMOUNT, MAX_PAYPAL_AMOUNT } from '@proton/shared/lib/constants';
import { doNotWindowOpen } from '@proton/shared/lib/helpers/browser';
import { Currency } from '@proton/shared/lib/interfaces';
import { c } from 'ttag';

import { Alert, DoNotWindowOpenAlertError, Price, Loader } from '../../components';
import PayPalButton from './PayPalButton';
import { PayPalHook } from './usePayPal';
import { PaymentMethodFlows } from '../paymentMethods/interface';

interface Props {
    paypal: PayPalHook;
    paypalCredit: PayPalHook;
    type?: PaymentMethodFlows;
    amount: number;
    currency: Currency;
}

const PayPalView = ({ type, amount, currency, paypal, paypalCredit }: Props) => {
    if (amount < MIN_PAYPAL_AMOUNT) {
        return (
            <Alert className="mb1" type="error">
                {c('Error').t`Amount below minimum.`} {`(${(<Price currency={currency}>{MIN_PAYPAL_AMOUNT}</Price>)})`}
            </Alert>
        );
    }

    if (amount > MAX_PAYPAL_AMOUNT) {
        return <Alert className="mb1" type="error">{c('Error').t`Amount above the maximum.`}</Alert>;
    }

    if (doNotWindowOpen()) {
        return <DoNotWindowOpenAlertError />;
    }

    const clickHere = (
        <PayPalButton
            shape="outline"
            color="norm"
            flow={type}
            key="click-here"
            size="small"
            paypal={paypalCredit}
            amount={amount}
        >
            {c('Link').t`click here`}
        </PayPalButton>
    );

    return (
        <div className="p1 border rounded bg-weak mb1">
            {paypal.loadingVerification ? <Loader /> : null}
            {!paypal.loadingVerification && type && ['signup', 'subscription', 'invoice', 'credit'].includes(type) ? (
                <>
                    <div className="mb1">
                        {c('Info')
                            .t`We will redirect you to PayPal in a new browser tab to complete this transaction. If you use any pop-up blockers, please disable them to continue.`}
                    </div>
                    <div className="mb1">
                        {c('Info')
                            .t`You must have a credit card or bank account linked with your PayPal account. If your PayPal account doesn't have that, please click on the button below.`}
                        <br />
                        {clickHere}
                    </div>
                </>
            ) : null}
            {type && !paypal.loadingVerification && ['donation', 'human-verification'].includes(type) ? (
                <>
                    <div className="mb1">
                        {c('Info')
                            .t`We will redirect you to PayPal in a new browser tab to complete this transaction. If you use any pop-up blockers, please disable them to continue.`}
                    </div>
                </>
            ) : null}
        </div>
    );
};

export default PayPalView;
