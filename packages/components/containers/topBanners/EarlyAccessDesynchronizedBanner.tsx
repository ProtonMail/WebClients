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

    if (!earlyAccess.isEnabled) {
        return null;
    }

    const refreshButton = (
        <InlineLinkButton
            key="refresh-button"
            onClick={() => {
                earlyAccess.updateVersionCookie(earlyAccess.targetEnvironment);
                window.location.reload();
            }}
        >
            {
                // translator: complete sentence example: "You have enabled Beta Access. Click <here> to use the latest/stable version of <ProtonMail>. The application will be reloaded."
                c('Action').t`here`
            }
        </InlineLinkButton>
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
                ? // translator: complete sentence example: "You have enabled Beta Access. Click <here> to use the latest version of <ProtonMail>. The application will be reloaded."
                  c('Info')
                      .jt`You have enabled Beta Access. Click ${refreshButton} to use the latest version of ${appName}. The application will be reloaded.`
                : // translator: complete sentence example: "You have disabled Beta Access. Click <here> to use the latest version of <ProtonMail>. The application will be reloaded."
                  c('Info')
                      .jt`You have disabled Beta Access. Click ${refreshButton} to use the stable version of ${appName}. The application will be reloaded.`}
        </TopBanner>
    );
};

export default EarlyAccessDesynchronizedBanner;
