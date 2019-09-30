import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Alert, Loader, SmallButton, Price, useApi, useLoading, PrimaryButton } from 'react-components';
import { MIN_PAYPAL_AMOUNT, MAX_PAYPAL_AMOUNT } from 'proton-shared/lib/constants';
import { createToken } from 'proton-shared/lib/api/payments';

import { toParams, process } from './paymentTokenHelper';

const PayPal = ({ amount: Amount, currency: Currency, onPay, type }) => {
    const api = useApi();
    const abortRef = useRef();
    const [loadingToken, withLoadingToken] = useLoading();
    const [loadingVerification, withLoadingVerification] = useLoading();
    const [textError, setTextError] = useState('');
    const modelRef = useRef({});

    const handleCancel = () => {
        abortRef.current && abortRef.current.abort();
    };

    const handleClick = async () => {
        try {
            abortRef.current = new AbortController();
            const { Token, ReturnHost, ApprovalURL } = modelRef.current;
            await process({ Token, api, ApprovalURL, ReturnHost, signal: abortRef.current.signal });
            onPay(toParams({ Amount, Currency }, Token));
        } catch (error) {
            // if not coming from API error
            if (error.message && !error.config) {
                setTextError(error.message);
            }
        }
    };

    const generateToken = async () => {
        const { Token, ApprovalURL, ReturnHost } = await api(
            createToken({
                Amount,
                Currency,
                Payment: {
                    Type: 'paypal'
                }
            })
        );
        modelRef.current = { Token, ApprovalURL, ReturnHost };
    };

    useEffect(() => {
        withLoadingToken(generateToken());
    }, [Amount, Currency]);

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

    if (textError) {
        return (
            <Alert type="error">
                <div className="mb0-5">{textError}</div>
                <div>
                    <SmallButton
                        loading={loadingToken}
                        onClick={() => {
                            setTextError('');
                            withLoadingToken(generateToken());
                        }}
                    >{c('Action').t`Try again`}</SmallButton>
                </div>
            </Alert>
        );
    }

    if (loadingToken) {
        return <Loader />;
    }

    return (
        <>
            {loadingVerification ? (
                <>
                    <Loader />
                    <Alert>
                        <div className="mb0-5">{c('Info').t`Please verify the payment in the new tab.`}</div>
                        <div>
                            <SmallButton onClick={handleCancel}>{c('Action').t`Cancel`}</SmallButton>
                        </div>
                    </Alert>
                </>
            ) : (
                <Alert>{c('Info')
                    .t`You will need to login to your PayPal account to complete this transaction. We will open a new tab with PayPal for you. If you use any pop-up blockers, please disable them to continue.`}</Alert>
            )}
            <PrimaryButton loading={loadingVerification} onClick={() => withLoadingVerification(handleClick())}>{c(
                'Action'
            ).t`Check out with PayPal`}</PrimaryButton>
        </>
    );
};

PayPal.propTypes = {
    amount: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    onPay: PropTypes.func.isRequired,
    type: PropTypes.oneOf(['signup', 'subscription', 'invoice', 'donation', 'credit', 'update'])
};

export default PayPal;
