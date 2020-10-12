import React from 'react';
import { APPS_CONFIGURATION } from 'proton-shared/lib/constants';

import { useModals, useConfig } from '../../hooks';
import ChangelogModal from './ChangelogModal';
import { getAppVersion } from '../../helpers';

interface Props {
    appName?: string;
    appVersion?: string;
    changelog?: string;
}

const AppVersion = ({ appVersion: maybeAppVersion, appName: maybeAppName, changelog }: Props) => {
    const { APP_NAME, APP_VERSION, APP_VERSION_DISPLAY, DATE_VERSION } = useConfig();
    const { createModal } = useModals();

    const handleModal = () => {
        createModal(<ChangelogModal changelog={changelog} />);
    };

    const appName = maybeAppName || APPS_CONFIGURATION[APP_NAME]?.name;
    const appVersion = getAppVersion(maybeAppVersion || APP_VERSION_DISPLAY || APP_VERSION);

    return (
        <button
            onClick={handleModal}
            disabled={!changelog}
            title={DATE_VERSION}
            className="smallest aligncenter opacity-50 mt0 mb0-5"
        >
            {appName} {appVersion}
        </button>
    );
};

export default AppVersion;
