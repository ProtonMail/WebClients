import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import { APPS_CONFIGURATION } from '@proton/shared/lib/constants';

import { useConfig } from '../../hooks';
import useApiStatus from '../../hooks/useApiStatus';
import TopBanner from './TopBanner';

const BadAppVersionBanner = () => {
    const { APP_NAME } = useConfig();
    const { appVersionBad } = useApiStatus();

    if (!appVersionBad) {
        return null;
    }

    const appName = APPS_CONFIGURATION[APP_NAME].name;
    const reload = () => window.location.reload();
    const reloadButton = (
        <InlineLinkButton key="reload-button" className="color-inherit" onClick={reload}>{c('Action')
            .t`Refresh the page`}</InlineLinkButton>
    );

    return (
        <TopBanner className="bg-danger">
            {c('Message display when a new app version is available')
                .jt`A new version of ${appName} is available. ${reloadButton}.`}
        </TopBanner>
    );
};

export default BadAppVersionBanner;
