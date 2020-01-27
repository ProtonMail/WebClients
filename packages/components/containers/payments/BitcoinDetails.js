import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Copy } from 'react-components';

const BitcoinDetails = ({ amount, address }) => {
    return (
        <figcaption>
            <div>{c('Label').t`BTC amount`}</div>
            <div className="flex flex-nowrap flex-items-center mb1">
                <span className="mr1" title={amount}>
                    {amount}
                </span>
                <Copy className="pm-button--small flex-item-noshrink" value={amount} />
            </div>
            <div>{c('Label').t`BTC address`}</div>
            <div className="flex flex-nowrap flex-items-center mb1">
                <span className="mr1 ellipsis" title={address}>
                    {address}
                </span>
                <Copy className="pm-button--small flex-item-noshrink" value={address} />
            </div>
        </figcaption>
    );
};

BitcoinDetails.propTypes = {
    amount: PropTypes.number.isRequired,
    address: PropTypes.string.isRequired
};

export default BitcoinDetails;
