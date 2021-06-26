import React, { ReactNode } from 'react';
import { c } from 'ttag';
import locales from 'proton-shared/lib/i18n/locales';
import { APPS, APP_NAMES } from 'proton-shared/lib/constants';
import { getAppName } from 'proton-shared/lib/apps/helper';

import { getAppVersion, useConfig, PublicTopBanners, Href, Icon, ProminentContainer, Logo } from 'react-components';

import LanguageSelect from './LanguageSelect';

import './Layout.scss';

export interface Props {
    children: ReactNode;
    hasLanguageSelect?: boolean;
    toApp: APP_NAMES;
}

const Layout = ({ children, toApp, hasLanguageSelect = true }: Props) => {
    const { APP_VERSION, APP_VERSION_DISPLAY } = useConfig();
    const termsLink = (
        <Href key="terms" className="signup-footer-link" href="https://protonmail.com/terms-and-conditions">{c('Link')
            .t`Terms`}</Href>
    );
    const privacyLink = (
        <Href key="privacy" className="signup-footer-link" href="https://protonmail.com/privacy-policy">{c('Link')
            .t`Privacy policy`}</Href>
    );
    const OldVersionLink = (
        <Href key="oldVersion" className="signup-footer-link old-link" href="https://old.protonmail.com/">{c('Link')
            .t`Previous version`}</Href>
    );

    const appVersion = getAppVersion(APP_VERSION_DISPLAY || APP_VERSION);

    const mailAppName = getAppName(APPS.PROTONMAIL);
    const calendarAppName = getAppName(APPS.PROTONCALENDAR);
    const driveAppName = getAppName(APPS.PROTONDRIVE);
    const vpnAppName = getAppName(APPS.PROTONVPN_SETTINGS);

    return (
        <ProminentContainer className="flex-no-min-children flex-nowrap flex-column h100 sign-layout-bg scroll-if-needed">
            <PublicTopBanners />
            <header className="flex flex-justify-space-between flex-align-items-center flex-item-noshrink p2">
                <span>
                    <Logo appName={toApp} to="/" toApp={toApp} target="_self" />
                </span>
                {hasLanguageSelect && (
                    <span className="text-right">
                        <LanguageSelect className="support-dropdown-button" locales={locales} />
                    </span>
                )}
            </header>
            <div className="pl2 pr2 sign-layout-container flex-item-fluid flex flex-nowrap flex-column flex-justify-space-between">
                <div>
                    {children}
                    <div className="flex-item-noshrink text-center p1">
                        <span className="text-sm">{c('Info').t`One account for all Proton services`}</span>
                        <div className="p0-5">
                            <Icon
                                name="protonmail"
                                className="ml0-5 mr0-5"
                                alt={mailAppName}
                                title={mailAppName}
                                size={20}
                            />
                            <Icon
                                name="protoncalendar"
                                className="ml0-5 mr0-5"
                                alt={calendarAppName}
                                title={calendarAppName}
                                size={20}
                            />
                            <Icon
                                name="protonvpn"
                                className="ml0-5 mr0-5"
                                alt={vpnAppName}
                                title={vpnAppName}
                                size={20}
                            />
                            <Icon
                                name="protondrive"
                                className="ml0-5 mr0-5"
                                alt={driveAppName}
                                title={driveAppName}
                                size={20}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <footer className="flex-item-noshrink text-center p1">
                <div className="text-center text-sm m0 pt1 pb0-5 flex-item-noshrink">
                    <span className="auto-mobile">{c('Info').t`Based in Switzerland, available globally`}</span>
                    <span className="color-weak pl0-75 pr0-75 no-mobile" aria-hidden="true">
                        |
                    </span>
                    <span className="auto-mobile">{termsLink}</span>
                    <span className="color-weak pl0-75 pr0-75 no-mobile" aria-hidden="true">
                        |
                    </span>
                    <span className="auto-mobile">{privacyLink}</span>
                    <span className="color-weak pl0-75 pr0-75 no-mobile" aria-hidden="true">
                        |
                    </span>
                    <span className="auto-mobile">{OldVersionLink}</span>
                    <span className="color-weak pl0-75 pr0-75 no-mobile" aria-hidden="true">
                        |
                    </span>
                    <span className="auto-mobile">{c('Info').jt`Version ${appVersion}`}</span>
                </div>
            </footer>
        </ProminentContainer>
    );
};

export default Layout;
