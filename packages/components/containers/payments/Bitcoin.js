import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Alert, Price, Button, Loader, useConfig, useApi, useLoading } from 'react-components';
import { createBitcoinPayment, createBitcoinDonation } from 'proton-shared/lib/api/payments';
import { MIN_BITCOIN_AMOUNT, CLIENT_TYPES } from 'proton-shared/lib/constants';

import BitcoinQRCode from './BitcoinQRCode';
import BitcoinDetails from './BitcoinDetails';

const { VPN } = CLIENT_TYPES;

const Bitcoin = ({ amount, currency, type }) => {
    const api = useApi();
    const { CLIENT_TYPE } = useConfig();
    const [loading, withLoading] = useLoading();
    const [error, setError] = useState(false);
    const [amountBitcoin, setAmountBitcoin] = useState();
    const [address, setAddress] = useState();

    const request = async () => {
        setError(false);
        try {
            const { AmountBitcoin, Address } = await api(
                type === 'donation' ? createBitcoinDonation(amount, currency) : createBitcoinPayment(amount, currency)
            );

            setAmountBitcoin(AmountBitcoin);
            setAddress(Address);
        } catch (error) {
            setError(true);
        }
    };

    useEffect(() => {
        if (amount >= MIN_BITCOIN_AMOUNT) {
            withLoading(request());
        }
    }, [amount, currency]);

    if (amount < MIN_BITCOIN_AMOUNT) {
        const i18n = (amount) => c('Info').jt`Amount below minimum (${amount}).`;
        return <Alert type="warning">{i18n(<Price currency={currency}>{MIN_BITCOIN_AMOUNT}</Price>)}</Alert>;
    }

    if (loading) {
        return <Loader />;
    }

    if (error || !address) {
        return (
            <>
                <Alert type="error">{c('Error').t`Error connecting to the Bitcoin API.`}</Alert>
                <Button onClick={() => withLoading(request())}>{c('Action').t`Try again`}</Button>
            </>
        );
    }

    return (
        <>
            <figure role="group">
                <BitcoinQRCode className="mb1 w50 center" amount={amountBitcoin} address={address} type={type} />
                <BitcoinDetails amount={amountBitcoin} address={address} />
            </figure>
            {type === 'invoice' ? (
                <Alert>{c('Info')
                    .t`Bitcoin transactions can take some time to be confirmed (up to 24 hours). Once confirmed, we will add credits to your account. After transaction confirmation, you can pay your invoice with the credits.`}</Alert>
            ) : (
                <Alert
                    learnMore={
                        CLIENT_TYPE === VPN
                            ? 'https://protonvpn.com/support/vpn-bitcoin-payments/'
                            : 'https://protonmail.com/support/knowledge-base/paying-with-bitcoin'
                    }
                >{c('Info')
                    .t`After making your Bitcoin payment, please follow the instructions below to upgrade.`}</Alert>
            )}
        </>
    );
};

Bitcoin.propTypes = {
    amount: PropTypes.number.isRequired,
    currency: PropTypes.oneOf(['EUR', 'CHF', 'USD']),
    type: PropTypes.string
};

export default Bitcoin;
