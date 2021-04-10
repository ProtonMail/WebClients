import React from 'react';
import PropTypes from 'prop-types';
import { MIN_PAYPAL_AMOUNT, MAX_PAYPAL_AMOUNT } from 'proton-shared/lib/constants';
import { doNotWindowOpen } from 'proton-shared/lib/helpers/browser';
import paypalSvg from 'design-system/assets/img/bank-icons/paypal.svg';
import { c } from 'ttag';

import { Alert, DoNotWindowOpenAlertError, Price, Loader } from '../../components';
import PayPalButton from './PayPalButton';

const PayPalView = ({ type, amount, currency, paypal, paypalCredit }) => {
    if (type === 'payment' && amount < MIN_PAYPAL_AMOUNT) {
        return (
            <Alert type="error">
                {c('Error').t`Amount below minimum.`} {`(${(<Price currency={currency}>{MIN_PAYPAL_AMOUNT}</Price>)})`}
            </Alert>
        );
    }

    if (amount > MAX_PAYPAL_AMOUNT) {
        return <Alert type="error">{c('Error').t`Amount above the maximum.`}</Alert>;
    }

    if (doNotWindowOpen()) {
        return <DoNotWindowOpenAlertError />;
    }

    const clickHere = (
        <PayPalButton type={type} key="click-here" size="small" paypal={paypalCredit} amount={amount}>
            {c('Link').t`click here`}
        </PayPalButton>
    );

    return (
        <div className="p1 bordered bg-weak mb1">
            {paypal.loading ? (
                <>
                    <Loader />
                    <Alert>{c('Info').t`Please verify the payment in the new tab.`}</Alert>
                </>
            ) : null}
            {!paypal.loading && ['signup', 'subscription', 'invoice', 'credit'].includes(type) ? (
                <>
                    <Alert>
                        {c('Info')
                            .t`We will redirect you to PayPal in a new browser tab to complete this transaction. If you use any pop-up blockers, please disable them to continue.`}
                    </Alert>
                    <div className="text-center mb1">
                        <img src={paypalSvg} alt="PayPal" width="250" />
                    </div>
                    <Alert>{c('Info')
                        .jt`You must have a credit card or bank account linked with your PayPal account. If your PayPal account doesn't have that, please ${clickHere}.`}</Alert>
                </>
            ) : null}
            {!paypal.loading && type === 'update' ? (
                <>
                    <Alert>
                        {c('Info')
                            .t`This will enable PayPal to be used to pay for your Proton subscription. We will redirect you to PayPal in a new browser tab. If you use any pop-up blockers, please disable them to continue.`}
                    </Alert>
                    <div className="text-center mb1">
                        <img src={paypalSvg} alt="PayPal" width="250" />
                    </div>
                    <Alert>{c('Info')
                        .t`You must have a credit card or bank account linked with your PayPal account in order to add it as a payment method.`}</Alert>
                </>
            ) : null}
            {!paypal.loading && ['donation', 'human-verification'].includes(type) ? (
                <>
                    <Alert>
                        {c('Info')
                            .t`We will redirect you to PayPal in a new browser tab to complete this transaction. If you use any pop-up blockers, please disable them to continue.`}
                    </Alert>
                    <div className="text-center">
                        <img src={paypalSvg} alt="PayPal" width="250" />
                    </div>
                </>
            ) : null}
        </div>
    );
};

PayPalView.propTypes = {
    type: PropTypes.oneOf(['signup', 'subscription', 'invoice', 'donation', 'credit', 'update', 'human-verification']),
    amount: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    paypal: PropTypes.object.isRequired,
    paypalCredit: PropTypes.object.isRequired,
};

export default PayPalView;
