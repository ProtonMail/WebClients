import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, useNotifications } from 'react-components';
import { doNotWindowOpen } from 'proton-shared/lib/helpers/browser';
import { MIN_PAYPAL_AMOUNT, MAX_PAYPAL_AMOUNT } from 'proton-shared/lib/constants';
import { c } from 'ttag';

const PayPalButton = ({ amount, children, className, paypal }) => {
    const [retry, setRetry] = useState(false);
    const { createNotification } = useNotifications();

    if (amount < MIN_PAYPAL_AMOUNT) {
        return null;
    }

    if (amount > MAX_PAYPAL_AMOUNT) {
        return null;
    }

    if (doNotWindowOpen()) {
        return null;
    }

    if (retry) {
        const handleRetry = () => {
            paypal.onToken();
            setRetry(false);
        };
        return <Button onClick={handleRetry} className={className}>{c('Action').t`Retry`}</Button>;
    }

    if (paypal.loadingVerification) {
        return <Button loading={true} className={className}>{c('Action').t`Loading verification`}</Button>;
    }

    const handleClick = async () => {
        try {
            await paypal.onVerification();
        } catch (error) {
            // if not coming from API error
            if (error.message && !error.config) {
                createNotification({ text: error.message, type: 'error' });
            }
            setRetry(true);
        }
    };

    return (
        <Button disabled={!paypal.isReady} onClick={handleClick} loading={paypal.loadingToken} className={className}>
            {children}
        </Button>
    );
};

PayPalButton.propTypes = {
    className: PropTypes.string,
    amount: PropTypes.number.isRequired,
    children: PropTypes.node.isRequired,
    paypal: PropTypes.object.isRequired
};

export default PayPalButton;
