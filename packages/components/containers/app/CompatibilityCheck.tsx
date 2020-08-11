import React, { useEffect } from 'react';
import unsupportedBrowserSettings from 'design-system/assets/img/shared/unsupported-browser-settings.svg';
import { APPS } from 'proton-shared/lib/constants';
import { Href, useConfig } from '../../index';

const isGoodPrngAvailable = () => {
    if (window.crypto && window.crypto.getRandomValues) {
        return true;
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return typeof window.msCrypto === 'object' && typeof window.msCrypto.getRandomValues === 'function';
};

const hasCookies = () => {
    try {
        return navigator.cookieEnabled;
    } catch (e) {
        // Safari throws SecurityError if storage is disabled
        return false;
    }
};

const hasSessionStorage = () => {
    try {
        return !!window.sessionStorage;
    } catch (e) {
        // Safari throws SecurityError if storage is disabled
        return false;
    }
};

const isSSR = typeof window === 'undefined';
// Locale is not loaded here so no translations
const compats = [
    {
        name: 'Cookies',
        valid: isSSR || hasCookies(),
        text: 'Please enable cookies in your browser.',
    },
    {
        name: 'Storage',
        valid: isSSR || hasSessionStorage(),
        text: 'Please enable sessionStorage in your browser.',
    },
    {
        name: 'PRNG',
        valid: isSSR || isGoodPrngAvailable(),
        text: 'Please update to a modern browser with support for PRNG.',
    },
];

const compat = compats.every(({ valid }) => valid);

interface Props {
    children: React.ReactNode;
}
const CompatibilityCheck = ({ children }: Props) => {
    const { APP_NAME } = useConfig();

    useEffect(() => {
        if (!compat) {
            document.title = 'Compatibility check';
        }
    }, []);

    if (compat) {
        return <>{children}</>;
    }

    const list = compats
        .filter(({ valid }) => !valid)
        .map(({ name, text }, i) => {
            return (
                <li key={i}>
                    {name}: {text}
                </li>
            );
        });

    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;
    const kbUrl = isVPN
        ? 'https://protonvpn.com/support/browsers-supported/'
        : 'https://protonmail.com/support/knowledge-base/browsers-supported/';

    return (
        <div className="w50 p2 mt2 center big automobile">
            <div className="aligncenter">
                <h1>Compatibility check</h1>
                <p>
                    Proton apps requires a modern web browser with cutting edge support for{' '}
                    <Href className="primary-link" url="http://caniuse.com/#feat=cryptography">
                        WebCrypto (PRNG)
                    </Href>{' '}
                    and{' '}
                    <Href className="primary-link" url="http://caniuse.com/#feat=namevalue-storage">
                        Web Storage
                    </Href>
                    .
                </p>
                <Href className="primary-link bold" url={kbUrl} target="_self">
                    More info
                </Href>
            </div>
            <div className="mt2 aligncenter">
                <img src={unsupportedBrowserSettings} alt="Compatibility check" />
            </div>
            <ul>{list}</ul>
        </div>
    );
};

export default CompatibilityCheck;
