import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { doNotWindowOpen } from '@proton/shared/lib/helpers/browser';
import { MIN_PAYPAL_AMOUNT, MAX_PAYPAL_AMOUNT } from '@proton/shared/lib/constants';
import { c } from 'ttag';
import { Button } from '../../components';
import { useNotifications } from '../../hooks';

/**
 * @type any
 */
const PayPalButton = ({ amount, type, children, paypal, ...rest }) => {
    const [retry, setRetry] = useState(false);
    const { createNotification } = useNotifications();

    if (amount < MIN_PAYPAL_AMOUNT && type !== 'invoice') {
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
        return <Button onClick={handleRetry} {...rest}>{c('Action').t`Retry`}</Button>;
    }

    if (paypal.loadingVerification) {
        return <Button loading {...rest}>{c('Action').t`Loading verification`}</Button>;
    }

    const handleClick = async () => {
        try {
            await paypal.onVerification();
        } catch (error) {
            // if not coming from API error
            if (error && error.message && !error.config) {
                createNotification({ text: error.message, type: 'error' });
            }
            setRetry(true);
        }
    };

    return (
        <Button disabled={!paypal.isReady} onClick={handleClick} loading={paypal.loadingToken} {...rest}>
            {children}
        </Button>
    );
};

PayPalButton.propTypes = {
    type: PropTypes.string,
    amount: PropTypes.number.isRequired,
    children: PropTypes.node.isRequired,
    paypal: PropTypes.object.isRequired,
};

export default PayPalButton;
