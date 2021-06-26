import React from 'react';
import { c } from 'ttag';
import { APPS_CONFIGURATION } from 'proton-shared/lib/constants';

import { useConfig } from '../../hooks';
import { InlineLinkButton } from '../../components/button';
import TopBanner from './TopBanner';

const NewVersionTopBannerView = ({ isError = false }: { isError?: boolean }) => {
    const { APP_NAME } = useConfig();

    const appName = APPS_CONFIGURATION[APP_NAME].name;
    const reloadTab = () => window.location.reload();
    const reloadButton = (
        <InlineLinkButton key="reload-button" className="color-inherit" onClick={() => reloadTab()}>{c('Action')
            .t`Refresh the page`}</InlineLinkButton>
    );

    return (
        <TopBanner className={isError ? 'bg-danger' : 'bg-info'}>
            {c('Message display when a new app version is available')
                .jt`A new version of ${appName} is available. ${reloadButton}.`}
        </TopBanner>
    );
};

export default NewVersionTopBannerView;
