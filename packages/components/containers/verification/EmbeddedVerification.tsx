import { useEffect, useMemo, useState } from 'react';
import { APPS, APPS_CONFIGURATION } from '@proton/shared/lib/constants';
import { HumanVerificationMethodType } from '@proton/shared/lib/interfaces';
import { stringifySearchParams } from '@proton/shared/lib/helpers/url';

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
    const [iframeHeight, setIframeHeight] = useState<number | undefined>();

    const embedUrl = useMemo(() => {
        const url = new URL(window.location.origin);
        const segments = url.host.split('.');
        segments[0] = APPS_CONFIGURATION[APPS.PROTONVERIFICATION].subdomain;
        url.hostname = segments.join('.');

        return url;
    }, []);

    const handleMessage = (e: MessageEvent) => {
        if (e.origin !== embedUrl.origin) {
            /*
             * Post message from unknown origin, exit to make sure
             * this handler doesn't do anything with it
             */
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

    useEffect(() => {
        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    const params = {
        methods,
        token,
        origin: window.location.origin,
        defaultCountry,
        defaultEmail,
        defaultPhone,
    };

    const src = `${embedUrl.toString()}?${stringifySearchParams(params)}`;

    return <iframe style={{ height: `${iframeHeight}px`, width: '100%' }} src={src} title="verification-iframe" />;
};

export default EmbeddedVerification;
