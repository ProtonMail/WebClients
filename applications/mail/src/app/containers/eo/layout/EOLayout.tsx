import { ReactNode } from 'react';
import { c } from 'ttag';
import { locales } from '@proton/shared/lib/i18n/locales';
import { APP_NAMES } from '@proton/shared/lib/constants';

import { getAppVersion, useConfig, PublicTopBanners, Href, ProminentContainer, Logo } from '@proton/components';

import LanguageSelect from './EOLanguageSelect';

import './EOLayout.scss';

export interface Props {
    children: ReactNode;
    hasLanguageSelect?: boolean;
    toApp: APP_NAMES;
}

const EOLayout = ({ children, toApp, hasLanguageSelect = true }: Props) => {
    const { APP_VERSION, APP_VERSION_DISPLAY } = useConfig();
    const termsLink = (
        <Href key="terms" className="eo-footer-link" href="https://protonmail.com/terms-and-conditions">{c('Link')
            .t`Terms`}</Href>
    );
    const privacyLink = (
        <Href key="privacy" className="eo-footer-link" href="https://protonmail.com/privacy-policy">{c('Link')
            .t`Privacy policy`}</Href>
    );
    const OldVersionLink = (
        <Href key="oldVersion" className="eo-footer-link" href="https://old.protonmail.com/">{c('Link')
            .t`Previous version`}</Href>
    );

    const appVersion = getAppVersion(APP_VERSION_DISPLAY || APP_VERSION);

    return (
        <ProminentContainer className="flex-no-min-children flex-nowrap flex-column h100 eo-layout-bg scroll-if-needed">
            <PublicTopBanners />
            <header className="flex flex-justify-space-between flex-align-items-center flex-item-noshrink p2">
                <span>
                    <Logo appName={toApp} to="/" toApp={toApp} target="_self" />
                </span>
                <div className="flex flex-flex-align-items-center">
                    {hasLanguageSelect && (
                        <span className="text-right flex flex-flex-align-items-center">
                            <LanguageSelect className="support-dropdown-button" locales={locales} />
                        </span>
                    )}
                    <div className="ml1">
                        <Href key="terms" className="button button-solid-norm" href="https://protonmail.com/signup">
                            {c('Link').t`Sign up for free`}
                        </Href>
                    </div>
                </div>
            </header>
            <div className="pl2 pr2 eo-layout-container flex-item-fluid flex flex-nowrap flex-column flex-justify-space-between">
                <div>{children}</div>
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

export default EOLayout;
