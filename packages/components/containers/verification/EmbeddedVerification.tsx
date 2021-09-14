import { useEffect, useMemo, useRef, useState } from 'react';
import { APPS } from '@proton/shared/lib/constants';
import { HumanVerificationMethodType } from '@proton/shared/lib/interfaces';
import { getAppUrlFromApiUrl, getAppUrlRelativeToOrigin, stringifySearchParams } from '@proton/shared/lib/helpers/url';

import { useConfig } from '../../hooks';

interface EmbeddedVerificationProps {
    token: string;
    methods: HumanVerificationMethodType[];
    defaultCountry?: string;
    defaultEmail?: string;
    defaultPhone?: string;
    onSuccess: (token: string, tokenType: HumanVerificationMethodType) => void;
}

const EmbeddedVerification = ({
    token,
    methods,
    onSuccess,
    defaultCountry,
    defaultEmail,
    defaultPhone,
}: EmbeddedVerificationProps) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeHeight, setIframeHeight] = useState<number | undefined>();
    const { API_URL } = useConfig();

    const embedUrl = useMemo(() => {
        if (window.location.origin.includes('localhost')) {
            return getAppUrlFromApiUrl(API_URL, APPS.PROTONVERIFICATION);
        }

        return getAppUrlRelativeToOrigin(window.location.origin, APPS.PROTONVERIFICATION);
    }, []);

    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            const { origin, data, source } = e;

            const contentWindow = iframeRef.current?.contentWindow;

            if (!contentWindow || origin !== embedUrl.origin || !data || source !== contentWindow) {
                return;
            }

            switch (e.data.type) {
                case 'verification-height': {
                    setIframeHeight(e.data.height);
                    break;
                }

                case 'verification-success': {
                    onSuccess(e.data.payload.token, e.data.payload.tokenType);
                    break;
                }

                default:
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [onSuccess]);

    const params = {
        methods,
        token,
        defaultCountry: defaultCountry || undefined,
        defaultEmail: defaultEmail || undefined,
        defaultPhone: defaultPhone || undefined,
    };

    const src = `${embedUrl.toString()}?${stringifySearchParams(params)}`;

    return (
        <iframe
            style={{ height: `${iframeHeight}px`, width: '100%' }}
            src={src}
            ref={iframeRef}
            title="verification-iframe"
            sandbox="allow-scripts allow-same-origin allow-popups"
        />
    );
};

export default EmbeddedVerification;
