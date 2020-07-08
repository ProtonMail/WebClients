import React, { useState, useEffect, useRef } from 'react';
import { getHost } from 'proton-shared/lib/helpers/url';
import { createUrl } from 'proton-shared/lib/fetch/helpers';
import { isURL } from 'proton-shared/lib/helpers/validators';
import { useConfig } from '../../../index';

interface Props {
    token: string;
    onSubmit: (token: string) => void;
}
const Captcha = ({ token, onSubmit }: Props) => {
    const [style, setStyle] = useState<any>();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { API_URL } = useConfig();
    const client = 'web';
    const host = isURL(API_URL) ? getHost(API_URL) : window.location.host;
    const url = createUrl('https://secure.protonmail.com/captcha/captcha.html', { token, client, host });
    const src = url.toString();
    const targetOrigin = url.origin;

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const contentWindow = iframeRef.current?.contentWindow;
            const { origin, data, source } = event;
            if (!contentWindow || origin !== targetOrigin || !data || source !== contentWindow) {
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

        window.addEventListener('message', handleMessage, false);
        return () => {
            window.removeEventListener('message', handleMessage, false);
        };
    }, []);

    return (
        <iframe
            ref={iframeRef}
            className="w100"
            src={src}
            style={style}
            sandbox="allow-scripts allow-same-origin allow-popups"
        />
    );
};

export default Captcha;
