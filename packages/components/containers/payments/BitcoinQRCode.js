import React from 'react';
import PropTypes from 'prop-types';
import { QRCode } from 'react-components';

const BitcoinQRCode = ({ amount, address, type, ...rest }) => {
    const url = type === 'donation' ? `bitcoin:${address}` : `bitcoin:${address}?amount=${amount}`;
    return <QRCode url={url} {...rest} />;
};

BitcoinQRCode.propTypes = {
    amount: PropTypes.number.isRequired,
    address: PropTypes.string.isRequired,
    type: PropTypes.string
};

export default BitcoinQRCode;
