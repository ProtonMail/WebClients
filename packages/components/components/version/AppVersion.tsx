import React from 'react';
import { c } from 'ttag';

import { APPS_CONFIGURATION } from '@proton/shared/lib/constants';

import { useModals, useConfig } from '../../hooks';
import ChangelogModal from './ChangelogModal';
import { getAppVersion } from '../../helpers';
import { Tooltip } from '../tooltip';

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
    const className = 'app-infos-version text-xs m0';
    const title = DATE_VERSION;
    const children = (
        <>
            <span className="app-infos-name mr0-25">{appName}</span>
            <span className="app-infos-number">{appVersion}</span>
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
        <Tooltip title={c('Storage').t`Release notes`}>
            <button type="button" onClick={handleModal} title={title} className={className}>
                {children}
            </button>
        </Tooltip>
    );
};

export default AppVersion;
