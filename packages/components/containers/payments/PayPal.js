import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Alert, PrimaryButton, SmallButton, useApiResult, Price } from 'react-components';
import { createPayPalPayment } from 'proton-shared/lib/api/payments';
import { API_CUSTOM_ERROR_CODES } from 'proton-shared/lib/errors';
import { parseURL } from 'proton-shared/lib/helpers/browser';
import { MIN_PAYPAL_AMOUNT, MAX_PAYPAL_AMOUNT } from 'proton-shared/lib/constants';

const PayPal = ({ amount, currency, onPay, type }) => {
    const { result = {}, loading, error = {}, request } = useApiResult(() => createPayPalPayment(amount, currency), []);
    const { ApprovalURL } = result;
    const reset = () => window.removeEventListener('message', receivePaypalMessage, false);
    const handleClick = () => window.open(ApprovalURL, 'PayPal');

    const receivePaypalMessage = (event) => {
        const origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.

        if (origin !== 'https://secure.protonmail.com') {
            return;
        }

        const { payerID: PayerID, paymentID: PaymentID, cancel: Cancel, token } = event.data;
        const { searchObject = {} } = parseURL(ApprovalURL);

        if (token !== searchObject.token) {
            return;
        }

        reset();
        onPay({ PayerID, PaymentID, Cancel });
    };

    useEffect(() => {
        reset();
        window.addEventListener('message', receivePaypalMessage, false);
        return () => {
            reset();
        };
    }, [ApprovalURL]);

    if (type === 'payment' && amount < MIN_PAYPAL_AMOUNT) {
        return (
            <Alert type="error">
                {c('Error').t`Amount below minimum.`} {`(${<Price currency={currency}>{MIN_PAYPAL_AMOUNT}</Price>})`}
            </Alert>
        );
    }

    if (amount > MAX_PAYPAL_AMOUNT) {
        return <Alert type="error">{c('Error').t`Amount above the maximum.`}</Alert>;
    }

    if (error.Code === API_CUSTOM_ERROR_CODES.PAYMENTS_PAYPAL_CONNECTION_EXCEPTION) {
        return (
            <Alert type="error">
                {c('Error').t`Error connecting to PayPal.`}
                <br />
                <SmallButton onClick={request}>{c('Action').t`Click here to try again`}</SmallButton>
            </Alert>
        );
    }

    return (
        <>
            <Alert>{c('Info')
                .t`You will need to login to your PayPal account to complete this transaction. We will open a new tab with PayPal for you. If you use any pop-up blockers, please disable them to continue.`}</Alert>
            <PrimaryButton loading={loading} onClick={handleClick}>{c('Action')
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
