import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import QRCodeJS from 'qrcodejs2';

const QRCode = ({ url: text, width = 128, height = 128, ...rest }) => {
    const divRef = useRef(null);

    useEffect(() => {
        const qrcode = new QRCodeJS(divRef.current, {
            text,
            width,
            height,
        });

        return () => {
            qrcode.clear();
        };
    }, [width, height]);

    return <div ref={divRef} {...rest} />;
};

QRCode.propTypes = {
    url: PropTypes.string.isRequired,
    width: PropTypes.number,
    height: PropTypes.number,
};

export default QRCode;
