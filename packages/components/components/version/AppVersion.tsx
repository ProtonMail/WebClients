import React from 'react';
import { useConfig, useModals } from 'react-components';

import ChangelogModal from './ChangelogModal';

const AppVersion = ({ appName, changelog }) => {
    const { APP_VERSION, DATE_VERSION } = useConfig();
    const { createModal } = useModals();

    const handleModal = () => {
        createModal(<ChangelogModal changelog={changelog} />);
    };

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
