import React from 'react';
import { c } from 'ttag';
import { APPS, SSO_PATHS } from 'proton-shared/lib/constants';

import TopBanner from './TopBanner';
import { useConfig } from '../../hooks';
import { Href } from '../../components';

const IS_INITIAL_LOGIN = [SSO_PATHS.AUTHORIZE, SSO_PATHS.LOGIN, '/'].includes(window.location.pathname);

const WelcomeV4TopBanner = () => {
    const { APP_NAME } = useConfig();

    if (!IS_INITIAL_LOGIN || APP_NAME !== APPS.PROTONACCOUNT) {
        return null;
    }

    const learnMoreLink = (
        <Href
            key="learn-more-link"
            className="underline inline-block color-inherit"
            url="https://protonmail.com/blog/new-protonmail"
        >{c('Link').t`learn more`}</Href>
    );

    return (
        <TopBanner className="bg-info">
            {c('Message display when user visit v4 login first time')
                .jt`Welcome to the new ProtonMail design, modern and easy to use. Sign in to continue or ${learnMoreLink}.`}
        </TopBanner>
    );
};

export default WelcomeV4TopBanner;
