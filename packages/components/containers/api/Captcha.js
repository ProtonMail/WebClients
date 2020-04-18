import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useConfig } from 'react-components';
import { getHost } from 'proton-shared/lib/helpers/url';
import { createUrl } from 'proton-shared/lib/fetch/helpers';
import { isURL } from 'proton-shared/lib/helpers/validators';

const Captcha = ({ token, onSubmit }) => {
    const [style, setStyle] = useState();
    const { API_URL } = useConfig();
    const client = 'web';
    const host = isURL(API_URL) ? getHost(API_URL) : window.location.host;
    const url = createUrl('https://secure.protonmail.com/captcha/captcha.html', { token, client, host });
    const src = url.toString();

    const handleMessage = (event) => {
        const { origin, originalEvent, data } = event;

        if (typeof origin === 'undefined' && typeof originalEvent.origin === 'undefined') {
            return;
        }

        // For Chrome, the origin property is in the event.originalEvent object.
        const source = origin || originalEvent.origin;

        // Change window.location.origin to wherever this is hosted ( 'https://secure.protonmail.com:443' )
        if (source !== 'https://secure.protonmail.com') {
            return;
        }

        if (data.type === 'pm_captcha') {
            onSubmit(data.token);
        }

        if (data.type === 'pm_height') {
            const height = event.data.height + 40;
            setStyle({ height: `${height}px` });
        }
    };

    useEffect(() => {
        window.addEventListener('message', handleMessage, false);

        return () => {
            window.removeEventListener('message', handleMessage, false);
        };
    }, []);

    return <iframe src={src} style={style} sandbox="allow-scripts allow-same-origin allow-popups" />;
};

Captcha.propTypes = {
    token: PropTypes.string.isRequired,
    onSubmit: PropTypes.func
};

export default Captcha;
