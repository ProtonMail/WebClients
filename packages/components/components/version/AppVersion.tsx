import { c } from 'ttag';

import { APPS_CONFIGURATION } from '@proton/shared/lib/constants';

import { getAppVersion } from '../../helpers';
import { useConfig, useEarlyAccess } from '../../hooks';
import { useModalState } from '../modalTwo';
import { Tooltip } from '../tooltip';
import ChangelogModal from './ChangelogModal';

interface Props {
    appName?: string;
    appVersion?: string;
    changelog?: string;
}

const envMap = {
    alpha: 'α',
    beta: 'β',
    relaunch: 'δ',
};

const AppVersion = ({ appVersion: maybeAppVersion, appName: maybeAppName, changelog }: Props) => {
    const { APP_NAME, APP_VERSION, DATE_VERSION } = useConfig();
    const { currentEnvironment } = useEarlyAccess();
    const [changelogModal, setChangelogModalOpen, render] = useModalState();

    const appName = maybeAppName || APPS_CONFIGURATION[APP_NAME]?.name;
    const appVersion = getAppVersion(maybeAppVersion || APP_VERSION);
    const className = 'app-infos-version text-xs m0';
    const title = DATE_VERSION;
    const children = (
        <>
            <span className="app-infos-name mr0-25">{appName}</span>
            <span className="app-infos-number" data-testid="app-infos:release-notes">
                {appVersion}
                {currentEnvironment && envMap[currentEnvironment] && ` ${envMap[currentEnvironment]}`}
            </span>
        </>
    );

    if (!changelog) {
        return (
            <span title={title} className={className}>
                {children}
            </span>
        );
    }

    return (
        <>
            {render && <ChangelogModal {...changelogModal} changelog={changelog} />}
            <Tooltip title={c('Storage').t`Release notes`}>
                <button
                    type="button"
                    data-testid="app-infos:release-notes-button"
                    onClick={() => setChangelogModalOpen(true)}
                    title={title}
                    className={className}
                >
                    {children}
                </button>
            </Tooltip>
        </>
    );
};

export default AppVersion;
