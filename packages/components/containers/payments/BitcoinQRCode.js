import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import QRCode from 'qrcodejs2';

const BitcoinQRCode = ({ amount, address, type }) => {
    const divRef = useRef();

    const getURL = () => {
        if (type === 'donation') {
            return `bitcoin:${address}`;
        }

        return `bitcoin:${address}?amount=${amount}`;
    };

    useEffect(() => {
        const qrcode = new QRCode(divRef.current, getURL());
        return () => {
            qrcode.clear();
        };
    }, []);

    return <div ref={divRef} />;
};

BitcoinQRCode.propTypes = {
    amount: PropTypes.number.isRequired,
    address: PropTypes.string.isRequired,
    type: PropTypes.string
};

export default BitcoinQRCode;
