import { c } from 'ttag';

import { TelemetryChangelog, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { APPS_CONFIGURATION } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

import { getAppVersion } from '../../helpers';
import { useApi, useConfig, useEarlyAccess } from '../../hooks';
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
    const api = useApi();
    const { APP_NAME, APP_VERSION, DATE_VERSION } = useConfig();
    const { currentEnvironment } = useEarlyAccess();
    const [changelogModal, setChangelogModalOpen, render] = useModalState();

    const appName = maybeAppName || APPS_CONFIGURATION[APP_NAME]?.name;
    const appVersion = getAppVersion(maybeAppVersion || APP_VERSION);
    const className = 'app-infos-version text-xs m-0';
    const title = DATE_VERSION;
    const children = (
        <>
            <span className="app-infos-name mr-1">{appName}</span>
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

    const handleOpenChangelog = () => {
        setChangelogModalOpen(true);

        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.changelogOpened,
            event: TelemetryChangelog.opened,
            dimensions: {
                app: APP_NAME,
            },
        });
    };

    return (
        <>
            {render && <ChangelogModal {...changelogModal} changelog={changelog} />}
            <Tooltip title={c('Storage').t`Release notes`}>
                <button
                    type="button"
                    data-testid="app-infos:release-notes-button"
                    onClick={handleOpenChangelog}
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
