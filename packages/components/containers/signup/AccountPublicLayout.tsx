import React, { ReactNode } from 'react';
import { TtagLocaleMap } from 'proton-shared/lib/interfaces/Locale';
import { c } from 'ttag';

import { useAppTitle, useConfig } from '../../hooks';
import { classnames, getAppVersion } from '../../helpers';

import { PublicTopBanners } from '../topBanners';
import { Href } from '../../components';

import PublicLanguageSelect from './PublicLanguageSelect';

import './AccountPublicLayout.scss';

export interface Props {
    children: ReactNode;
    title: string;
    subtitle?: string;
    aside?: ReactNode;
    right?: ReactNode;
    left?: ReactNode;
    center?: ReactNode;
    larger?: boolean;
    locales?: TtagLocaleMap;
}

const AccountPublicLayout = ({ children, title, subtitle, aside, larger, left, center, right, locales }: Props) => {
    const { APP_VERSION, APP_VERSION_DISPLAY } = useConfig();
    const termsLink = (
        <Href key="terms" className="signup-footer-link" href="https://protonmail.com/terms-and-conditions">{c('Link')
            .t`Terms`}</Href>
    );
    const privacyLink = (
        <Href key="privacy" className="signup-footer-link" href="https://protonmail.com/privacy-policy">{c('Link')
            .t`Privacy policy`}</Href>
    );

    useAppTitle(title);

    const appVersion = getAppVersion(APP_VERSION_DISPLAY || APP_VERSION);

    return (
        <div className="scroll-if-needed h100v">
            <PublicTopBanners />
            <div className="pt1 pb1 pl2 pr2 on-mobile-p0 sign-layout-container flex flex-nowrap flex-column flex-justify-space-between">
                <div className="flex-item-fluid-auto sign-layout flex-item-noshrink flex flex-column flex-nowrap">
                    <div className="flex flex-column flex-nowrap flex-item-noshrink on-mobile-flex-item-fluid-auto">
                        <div
                            className={classnames([
                                'center bg-white-dm color-global-grey-dm mt2 mb2 on-mobile-mt0 on-mobile-mb0 on-mobile-pb1 w100 max-w100 bordered-container flex-item-noshrink flex flex-nowrap signup-container',
                                larger ? '' : 'max-w50e',
                            ])}
                        >
                            <main className="on-mobile-p1 flex-item-fluid sign-layout-main flex-no-min-children flex-column flex-nowrap">
                                <header className="flex flex-align-items-center flex-nowrap mb2">
                                    <span className="flex-item-fluid flex">{left}</span>
                                    <span className="text-center flex w70p">{center}</span>
                                    <span className="flex-item-fluid flex text-right" />
                                </header>
                                <div className="mb2 flex-item-fluid sign-layout-main-content">
                                    {title ? (
                                        <h1 className={classnames(['h4 text-bold mt0', subtitle ? 'mb0-25' : 'mb1'])}>
                                            {title}
                                        </h1>
                                    ) : null}
                                    {subtitle ? <div className="mb1">{subtitle}</div> : null}
                                    {children}
                                </div>
                                <footer className="flex flex-align-items-center flex-nowrap">
                                    <span className="flex-item-fluid">
                                        {locales ? (
                                            <PublicLanguageSelect
                                                className="support-dropdown-button link"
                                                locales={locales}
                                            />
                                        ) : null}
                                    </span>
                                    <span className="flex-item-fluid text-right">{right}</span>
                                </footer>
                            </main>
                            {aside ? (
                                <aside className="no-mobile bg-global-highlight w33 p2 flex flex-align-items-center flex-justify-center text-sm m0 sign-layout-aside">
                                    {aside}
                                </aside>
                            ) : null}
                        </div>
                    </div>
                </div>
                <footer className="text-center text-sm m0 pt0-5 pb0-5 flex-item-noshrink">
                    <span className="opacity-50 auto-mobile">{c('Info').t`Made globally - Hosted in Switzerland`}</span>
                    <span className="opacity-50 pl0-75 pr0-75 no-mobile" aria-hidden="true">
                        |
                    </span>
                    <span className="auto-mobile">{termsLink}</span>
                    <span className="opacity-50 pl0-75 pr0-75 no-mobile" aria-hidden="true">
                        |
                    </span>
                    <span className="auto-mobile">{privacyLink}</span>
                    <span className="opacity-50 pl0-75 pr0-75 no-mobile" aria-hidden="true">
                        |
                    </span>
                    <span className="opacity-50 auto-mobile">{c('Info').jt`Version ${appVersion}`}</span>
                </footer>
            </div>
        </div>
    );
};

export default AccountPublicLayout;
