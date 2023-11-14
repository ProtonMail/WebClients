import { Href } from '@proton/atoms';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import unsupportedBrowserSettings from '@proton/styles/assets/img/errors/unsupported-browser.svg';

import { useAppTitle } from '../../hooks';

interface Props {
    appName: APP_NAMES;
    incompatibilities: { name: string; text: string }[];
}

// Note: This is not translated because locales are not loaded at this point
const CompatibilityCheckView = ({ appName = APPS.PROTONMAIL, incompatibilities }: Props) => {
    const isVPN = appName === APPS.PROTONVPN_SETTINGS;
    const kbUrl = isVPN
        ? 'https://protonvpn.com/support/browsers-supported/'
        : getKnowledgeBaseUrl('/recommended-browsers');

    useAppTitle('Compatibility check');

    const app = getAppName(appName);

    return (
        <div className="w-full md:w-1/2 p-7 mt-8 mx-auto text-lg">
            <div className="text-center">
                <h1>Compatibility check</h1>
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
                <Href className="primary-link text-bold" href={kbUrl} target="_self">
                    More info
                </Href>
            </div>
            <div className="mt-8 text-center">
                <img src={unsupportedBrowserSettings} alt="Compatibility check" />
            </div>
            <ul>
                {incompatibilities.map(({ name, text }, i) => {
                    return (
                        <li key={i}>
                            {name}: {text}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default CompatibilityCheckView;
