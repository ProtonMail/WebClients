import React, { ReactNode } from 'react';
import { c } from 'ttag';
import locales from 'proton-shared/lib/i18n/locales';

import {
    getAppVersion,
    useConfig,
    PublicTopBanners,
    Href,
    Icon,
    ProtonLogo,
    ProminentContainer,
} from 'react-components';

import LanguageSelect from './LanguageSelect';

import './Layout.scss';

export interface Props {
    children: ReactNode;
    hasLanguageSelect?: boolean;
}

const Layout = ({ children, hasLanguageSelect = true }: Props) => {
    const { APP_VERSION, APP_VERSION_DISPLAY } = useConfig();
    const termsLink = (
        <Href key="terms" className="signup-footer-link" href="https://protonmail.com/terms-and-conditions">{c('Link')
            .t`Terms`}</Href>
    );
    const privacyLink = (
        <Href key="privacy" className="signup-footer-link" href="https://protonmail.com/privacy-policy">{c('Link')
            .t`Privacy policy`}</Href>
    );

    const appVersion = getAppVersion(APP_VERSION_DISPLAY || APP_VERSION);

    return (
        <ProminentContainer className="flex-no-min-children flex-nowrap flex-column h100 sign-layout-bg scroll-if-needed">
            <PublicTopBanners />
            <header className="flex flex-justify-space-between flex-item-noshrink p2">
                <span>
                    <ProtonLogo />
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
                    <div className="text-center text-sm m0 pt1 pb0-5 flex-item-noshrink">
                        <span className="auto-mobile">{c('Info').t`Made globally, based in Switzerland`}</span>
                        <span className="color-weak pl0-75 pr0-75 no-mobile" aria-hidden="true">
                            |
                        </span>
                        <span className="auto-mobile">{termsLink}</span>
                        <span className="color-weak pl0-75 pr0-75 no-mobile" aria-hidden="true">
                            |
                        </span>
                        <span className="auto-mobile">{privacyLink}</span>
                    </div>
                    <div className="color-weak text-center text-sm m0 pt0 pb0-5 auto-mobile">{c('Info')
                        .jt`Version ${appVersion}`}</div>
                </div>
            </div>
            <footer className="flex-item-noshrink text-center no-mobile p1">
                <span className="text-sm">{c('Info').t`One account for all Proton services`}</span>
                <div className="p0-5">
                    <Icon name="protonmail" className="ml0-5 mr0-5" alt="Proton Mail" size={20} />
                    <Icon name="protoncalendar" className="ml0-5 mr0-5" alt="Proton Calendar" size={20} />
                    <Icon name="protonvpn" className="ml0-5 mr0-5" alt="Proton VPN" size={20} />
                    <Icon name="protondrive" className="ml0-5 mr0-5" alt="Proton Drive" size={20} />
                </div>
            </footer>
        </ProminentContainer>
    );
};

export default Layout;
