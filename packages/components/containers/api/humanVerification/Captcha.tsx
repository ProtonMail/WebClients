import { useEffect, useRef, useState } from 'react';

import Loader from '@proton/components/components/loader/Loader';
import { getApiSubdomainUrl } from '@proton/shared/lib/helpers/url';

import type { CaptchaTheme } from './interface';

const getIframeUrl = (token: string, theme?: CaptchaTheme) => {
    const url = getApiSubdomainUrl('/core/v4/captcha', window.location.origin);
    url.searchParams.set('Token', token);
    url.searchParams.set('ForceWebMessaging', '1');
    if (theme === 'dark') {
        url.searchParams.set('Dark', 'true');
    }
    return url;
};

interface Props {
    token: string;
    theme?: CaptchaTheme;
    onSubmit: (token: string) => void;
}

const Captcha = ({ token, theme, onSubmit }: Props) => {
    const [style, setStyle] = useState<any>();
    const [loading, setLoading] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const iframeUrl = getIframeUrl(token, theme);

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
                setStyle({ '--h-custom': `${height / 16}rem` });
            }
        };

        window.addEventListener('message', handleMessage, false);
        return () => {
            window.removeEventListener('message', handleMessage, false);
        };
    }, []);

    return (
        <>
            {loading && <Loader />}
            <iframe
                onLoad={() => setLoading(false)}
                title="Captcha"
                ref={iframeRef}
                className="w-full h-custom"
                src={src}
                style={style}
                sandbox="allow-scripts allow-same-origin allow-popups"
            />
        </>
    );
};

export default Captcha;
