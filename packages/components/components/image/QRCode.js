import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import QRCodeJS from 'qrcodejs2';

const QRCode = ({ url, ...rest }) => {
    const divRef = useRef(null);

    useEffect(() => {
        const qrcode = new QRCodeJS(divRef.current, url);
        return () => {
            qrcode.clear();
        };
    }, []);

    return <div ref={divRef} {...rest} />;
};

QRCode.propTypes = {
    url: PropTypes.string.isRequired
};

export default QRCode;
