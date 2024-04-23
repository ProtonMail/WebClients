import { APPS_CONFIGURATION } from '@proton/shared/lib/constants';

import { getAppVersion } from '../../helpers';
import { useConfig, useEarlyAccess } from '../../hooks';
import { Tooltip } from '../tooltip';

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
    const { APP_NAME, APP_VERSION, DATE_VERSION } = useConfig();
    const { currentEnvironment } = useEarlyAccess();

    const appName = maybeAppName || APPS_CONFIGURATION[APP_NAME]?.name;
    const appVersion = maybeAppVersion || getAppVersion(APP_VERSION);
    const className = 'app-infos-version text-xs m-0';
    const title = DATE_VERSION;

    const currentEnvDisplay = currentEnvironment && envMap[currentEnvironment] && envMap[currentEnvironment];
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
            <Tooltip title={`${fullVersion} ${currentEnvDisplay}`} className={className}>
                <span title={title}>{children}</span>
            </Tooltip>
        );
    }

    return (
        <span title={title} className={className}>
            {children}
        </span>
    );
};

export default AppVersion;
