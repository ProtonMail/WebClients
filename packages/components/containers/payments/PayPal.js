import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Alert, PrimaryButton, SmallButton, Price, useApi, useLoading } from 'react-components';
import { MIN_PAYPAL_AMOUNT, MAX_PAYPAL_AMOUNT } from 'proton-shared/lib/constants';

import { handle3DS } from './paymentTokenHelper';

const PayPal = ({ amount: Amount, currency: Currency, onPay, type }) => {
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const [error, setError] = useState();

    const handleClick = async () => {
        try {
            const requestBody = await handle3DS(
                {
                    Amount,
                    Currency,
                    Payment: {
                        Type: 'paypal'
                    }
                },
                api
            );
            onPay(requestBody);
        } catch (error) {
            setError(error);
        }
    };

    if (type === 'payment' && Amount < MIN_PAYPAL_AMOUNT) {
        return (
            <Alert type="error">
                {c('Error').t`Amount below minimum.`} {`(${<Price currency={Currency}>{MIN_PAYPAL_AMOUNT}</Price>})`}
            </Alert>
        );
    }

    if (Amount > MAX_PAYPAL_AMOUNT) {
        return <Alert type="error">{c('Error').t`Amount above the maximum.`}</Alert>;
    }

    if (error) {
        return (
            <Alert type="error">
                <div className="mb0-5">{error.message}</div>
                <div>
                    <SmallButton
                        loading={loading}
                        onClick={() => {
                            setError();
                            withLoading(handleClick());
                        }}
                    >{c('Action').t`Try again`}</SmallButton>
                </div>
            </Alert>
        );
    }

    return (
        <>
            <Alert>{c('Info')
                .t`You will need to login to your PayPal account to complete this transaction. We will open a new tab with PayPal for you. If you use any pop-up blockers, please disable them to continue.`}</Alert>
            <PrimaryButton onClick={() => withLoading(handleClick())} loading={loading}>{c('Action')
                .t`Check out with PayPal`}</PrimaryButton>
        </>
    );
};

PayPal.propTypes = {
    amount: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    onPay: PropTypes.func.isRequired,
    type: PropTypes.string
};

export default PayPal;
