import { c } from 'ttag';

import Tooltip from '@proton/components/components/tooltip/Tooltip';
import { getAppVersion } from '@proton/components/helpers/appVersion';
import { APPS_CONFIGURATION } from '@proton/shared/lib/constants';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';

import { useConfig, useEarlyAccess, useNotifications } from '../../hooks';

interface Props {
    appVersion?: string;
    appName?: string;
    fullVersion?: string;
}

const envMap = {
    alpha: 'α',
    beta: 'β',
    relaunch: 'δ',
};

const AppVersion = ({ appVersion: maybeAppVersion, appName: maybeAppName, fullVersion }: Props) => {
    const { APP_NAME, APP_VERSION } = useConfig();
    const { currentEnvironment } = useEarlyAccess();
    const { createNotification } = useNotifications();

    const appName = maybeAppName || APPS_CONFIGURATION[APP_NAME]?.name;
    const appVersion = maybeAppVersion || getAppVersion(APP_VERSION);
    const className = 'app-infos-version text-xs m-0';

    const currentEnvDisplay = currentEnvironment && envMap[currentEnvironment] ? envMap[currentEnvironment] : '';
    const children = (
        <>
            <span className="app-infos-name mr-1">{appName}</span>
            <span className="app-infos-number" data-testid="app-infos:release-notes">
                {appVersion} {currentEnvDisplay}
            </span>
        </>
    );

    if (fullVersion) {
        return (
            <Tooltip title={`Copy “${fullVersion} ${currentEnvDisplay}” to clipboard`} className={className}>
                <button
                    type="button"
                    onClick={() => {
                        textToClipboard(fullVersion);
                        createNotification({ text: c('Info').t`Version number successfully copied to clipboard` });
                    }}
                >
                    {children}
                </button>
            </Tooltip>
        );
    }

    return (
        <Tooltip title={c('Action').t`Copy version number to clipboard`} className={className}>
            <button
                type="button"
                onClick={() => {
                    textToClipboard(appVersion);
                    createNotification({ text: c('Info').t`Version number successfully copied to clipboard` });
                }}
                className={className}
            >
                {children}
            </button>
        </Tooltip>
    );
};

export default AppVersion;
