import React from 'react';
import { APPS_CONFIGURATION } from 'proton-shared/lib/constants';

import { useModals, useConfig } from '../../hooks';
import ChangelogModal from './ChangelogModal';

interface Props {
    appName?: string;
    changelog?: string;
}

const AppVersion = ({ appName: maybeAppName, changelog }: Props) => {
    const { APP_NAME, APP_VERSION, DATE_VERSION } = useConfig();
    const { createModal } = useModals();

    const handleModal = () => {
        createModal(<ChangelogModal changelog={changelog} />);
    };

    const appName = maybeAppName || APPS_CONFIGURATION[APP_NAME]?.name;

    return (
        <button
            onClick={handleModal}
            disabled={!changelog}
            title={DATE_VERSION}
            className="smallest aligncenter opacity-50 mt0 mb0-5"
        >
            {appName} {APP_VERSION}
        </button>
    );
};

export default AppVersion;
