import { useEffect } from 'react';

import { Href } from '@proton/atoms';
import { getAppName } from '@proton/shared/lib/apps/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { getBrowser } from '@proton/shared/lib/helpers/browser';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import unsupportedBrowserSettings from '@proton/styles/assets/img/errors/unsupported-browser.svg';

import useAppTitle from '../../hooks/useAppTitle';

interface Props {
    appName: APP_NAMES;
    incompatibilities: { name: string; text: string }[];
}

const key = 'compatibility-check.notified';

// Note: This is not translated because locales are not loaded at this point
const CompatibilityCheckView = ({ appName = APPS.PROTONMAIL, incompatibilities }: Props) => {
    const isVPN = appName === APPS.PROTONVPN_SETTINGS;
    const kbUrl = isVPN
        ? 'https://protonvpn.com/support/browsers-supported/'
        : getKnowledgeBaseUrl('/recommended-browsers');

    useAppTitle('Compatibility check');

    useEffect(() => {
        const notified = getItem(key);
        if (!notified) {
            captureMessage('Compatibility check failed', {
                level: 'warning',
                extra: { reason: incompatibilities.map(({ name }) => name).join(',') },
            });
            setItem(key, '1');
        }
    }, []);

    const app = getAppName(appName);
    const incompatibilitiesWithText = incompatibilities.filter((incompat) => !!incompat.text);
    const browser = getBrowser();

    return (
        <div className="h-full flex items-center overflow-auto">
            <div className="m-auto text-center max-w-custom" style={{ '--max-w-custom': '30em' }}>
                <div className="mb-8 text-center">
                    <img src={unsupportedBrowserSettings} alt="" />
                </div>
                <h1 className="text-bold text-4xl">Compatibility check</h1>
                <p>
                    {app} requires a modern web browser with cutting edge support for{' '}
                    <Href className="primary-link" href="http://caniuse.com/#feat=cryptography">
                        WebCrypto (PRNG)
                    </Href>{' '}
                    and{' '}
                    <Href className="primary-link" href="http://caniuse.com/#feat=namevalue-storage">
                        Web Storage
                    </Href>
                    .
                </p>
                <p>Your browser: {`${browser.name} - ${browser.version}`}</p>
                {incompatibilitiesWithText.length > 0 && (
                    <ul className="text-left">
                        {incompatibilitiesWithText.map(({ name, text }) => {
                            return (
                                <li key={name}>
                                    {name}: {text}
                                </li>
                            );
                        })}
                    </ul>
                )}
                <Href href={kbUrl} target="_self">
                    More info
                </Href>
            </div>
        </div>
    );
};

export default CompatibilityCheckView;
