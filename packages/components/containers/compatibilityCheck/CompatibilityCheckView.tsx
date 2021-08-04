import unsupportedBrowserSettings from '@proton/styles/assets/img/errors/unsupported-browser.svg';
import { APP_NAMES, APPS } from '@proton/shared/lib/constants';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { useAppTitle } from '../../hooks';
import { Href } from '../../components';

interface Props {
    appName: APP_NAMES;
    incompatibilities: { name: string; text: string }[];
}

// Note: This is not translated because locales are not loaded at this point
const CompatibilityCheckView = ({ appName = APPS.PROTONMAIL, incompatibilities }: Props) => {
    const isVPN = appName === APPS.PROTONVPN_SETTINGS;
    const kbUrl = isVPN
        ? 'https://protonvpn.com/support/browsers-supported/'
        : 'https://protonmail.com/support/knowledge-base/browsers-supported/';

    useAppTitle('Compatibility check');

    const app = getAppName(appName);

    return (
        <div className="w50 p2 mt2 center text-lg auto-mobile">
            <div className="text-center">
                <h1>Compatibility check</h1>
                <p>
                    {app} requires a modern web browser with cutting edge support for{' '}
                    <Href className="primary-link" url="http://caniuse.com/#feat=cryptography">
                        WebCrypto (PRNG)
                    </Href>{' '}
                    and{' '}
                    <Href className="primary-link" url="http://caniuse.com/#feat=namevalue-storage">
                        Web Storage
                    </Href>
                    .
                </p>
                <Href className="primary-link text-bold" url={kbUrl} target="_self">
                    More info
                </Href>
            </div>
            <div className="mt2 text-center">
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
