import React from 'react';
import { c } from 'ttag';
import { getAppFromPathnameSafe } from 'proton-shared/lib/apps/slugHelper';
import { getAppName } from 'proton-shared/lib/apps/helper';
import { APPS } from 'proton-shared/lib/constants';

import { InlineLinkButton } from '../../components';
import { useConfig } from '../../hooks';
import useEarlyAccess from '../../hooks/useEarlyAccess';
import TopBanner from './TopBanner';

const EarlyAccessDesynchronizedBanner = () => {
    const { APP_NAME } = useConfig();
    const earlyAccess = useEarlyAccess();

    // translator: complete sentence example: "You have enabled/disabled Early Access. <Refresh> the page to use the latest/stable version of <ProtonMail>."
    const refreshButton = (
        <InlineLinkButton
            key="refresh-button"
            onClick={() => {
                window.location.reload();
            }}
        >{c('Action').t`Refresh`}</InlineLinkButton>
    );

    if (!earlyAccess.environmentIsDesynchronized) {
        return null;
    }

    const appName = getAppName(
        (APP_NAME === APPS.PROTONACCOUNT && getAppFromPathnameSafe(window.location.pathname)) || APP_NAME
    );

    return (
        <TopBanner className="bg-info">
            {earlyAccess.value
                ? // translator: complete sentence example: "You have enabled Early Access. <Refresh> the page to use the latest version of <ProtonMail>."
                  c('Info')
                      .jt`You have enabled Early Access. ${refreshButton} the page to use the latest version of ${appName}.`
                : // translator: complete sentence example: "You have disabled Early Access. <Refresh> the page to use the stable version of <ProtonMail>."
                  c('Info')
                      .jt`You have disabled Early Access. ${refreshButton} the page to use the stable version of ${appName}.`}
        </TopBanner>
    );
};

export default EarlyAccessDesynchronizedBanner;
