import React, { useState, useEffect, useRef } from 'react';
import { getRelativeApiHostname } from '@proton/shared/lib/helpers/url';
import { useConfig } from '../../../hooks';

const getIframeUrl = (apiUrl: string, token: string) => {
    const url = new URL(apiUrl, window.location.origin);
    url.hostname = getRelativeApiHostname(url.hostname);
    url.pathname = '/core/v4/captcha';
    url.searchParams.set('Token', token);
    return url;
};

interface Props {
    token: string;
    onSubmit: (token: string) => void;
}

const Captcha = ({ token, onSubmit }: Props) => {
    const [style, setStyle] = useState<any>();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { API_URL } = useConfig();

    const iframeUrl = getIframeUrl(API_URL, token);

    const src = iframeUrl.toString();
    const targetOrigin = iframeUrl.origin;

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
                const height = event.data.height + 40 + 100;
                setStyle({ height: `${height / 16}rem` });
            }
        };

        window.addEventListener('message', handleMessage, false);
        return () => {
            window.removeEventListener('message', handleMessage, false);
        };
    }, []);

    return (
        <iframe
            title="Captcha"
            ref={iframeRef}
            className="w100"
            src={src}
            style={style}
            sandbox="allow-scripts allow-same-origin allow-popups"
        />
    );
};

export default Captcha;
