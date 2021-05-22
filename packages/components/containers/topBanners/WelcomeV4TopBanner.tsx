import React from 'react';
import { c } from 'ttag';
import { APPS, SSO_PATHS } from 'proton-shared/lib/constants';

import TopBanner from './TopBanner';
import { useConfig } from '../../hooks';

const IS_INITIAL_LOGIN = [SSO_PATHS.AUTHORIZE, SSO_PATHS.LOGIN, '/'].includes(window.location.pathname);

const WelcomeV4TopBanner = () => {
    const { APP_NAME } = useConfig();

    if (!IS_INITIAL_LOGIN || APP_NAME !== APPS.PROTONACCOUNT) {
        return null;
    }

    return (
        <TopBanner className="bg-info">
            {c('Message display when user visit v4 login first time')
                .t`Welcome to the new ProtonMail design, modern and easy to use. Sign in to discover more.`}
        </TopBanner>
    );
};

export default WelcomeV4TopBanner;
