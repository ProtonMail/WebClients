import React from 'react';
import PropTypes from 'prop-types';
import { QRCode } from '../../components';

const BitcoinQRCode = ({ amount, address, ...rest }) => {
    const url = `bitcoin:${address}?amount=${amount}`;
    return <QRCode url={url} {...rest} />;
};

BitcoinQRCode.propTypes = {
    amount: PropTypes.number,
    address: PropTypes.string.isRequired,
};

export default BitcoinQRCode;
