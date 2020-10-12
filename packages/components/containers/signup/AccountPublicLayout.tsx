import React, { ReactNode } from 'react';
import { TtagLocaleMap } from 'proton-shared/lib/interfaces/Locale';
import { c } from 'ttag';

import { useAppTitle, useConfig } from '../../hooks';
import { classnames, getAppVersion } from '../../helpers';

import PublicTopBanners from '../app/PublicTopBanners';
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
            <div className="pt1 pb1 pl2 pr2 onmobile-p0 signLayout-container flex flex-nowrap flex-column flex-spacebetween">
                <div className="flex-item-fluid-auto signLayout flex-item-noshrink flex flex-column flex-nowrap">
                    <div className="flex flex-column flex-nowrap flex-item-noshrink onmobile-flex-item-fluid-auto">
                        <div
                            className={classnames([
                                'center bg-white-dm color-global-grey-dm mt2 mb2 onmobile-mt0 onmobile-mb0 onmobile-pb1 w100 mw100 bordered-container flex-item-noshrink flex flex-nowrap signup-container',
                                larger ? '' : 'mw50e',
                            ])}
                        >
                            <main className="onmobile-p1 flex-item-fluid signLayout-main flex-noMinChildren flex-column flex-nowrap">
                                <header className="flex flex-items-center flex-nowrap mb2">
                                    <span className="flex-item-fluid flex">{left}</span>
                                    <span className="aligncenter flex w70p">{center}</span>
                                    <span className="flex-item-fluid flex alignright" />
                                </header>
                                <div className="mb2 flex-item-fluid signLayout-main-content">
                                    {title ? (
                                        <h1 className={classnames(['h4 bold mt0', subtitle ? 'mb0-25' : 'mb1'])}>
                                            {title}
                                        </h1>
                                    ) : null}
                                    {subtitle ? <div className="mb1">{subtitle}</div> : null}
                                    {children}
                                </div>
                                <footer className="flex flex-items-center flex-nowrap">
                                    <span className="flex-item-fluid">
                                        {locales ? (
                                            <PublicLanguageSelect
                                                className="support-dropdown-button link"
                                                locales={locales}
                                            />
                                        ) : null}
                                    </span>
                                    <span className="flex-item-fluid alignright">{right}</span>
                                </footer>
                            </main>
                            {aside ? (
                                <aside className="nomobile bg-global-highlight w33 p2 flex flex-items-center flex-justify-center small m0 signLayout-aside">
                                    {aside}
                                </aside>
                            ) : null}
                        </div>
                    </div>
                </div>
                <footer className="aligncenter small m0 pt0-5 pb0-5 flex-item-noshrink">
                    <span className="opacity-50 automobile">{c('Info').t`Made globally - Hosted in Switzerland`}</span>
                    <span className="opacity-50 pl0-75 pr0-75 nomobile" aria-hidden="true">
                        |
                    </span>
                    <span className="automobile">{termsLink}</span>
                    <span className="opacity-50 pl0-75 pr0-75 nomobile" aria-hidden="true">
                        |
                    </span>
                    <span className="automobile">{privacyLink}</span>
                    <span className="opacity-50 pl0-75 pr0-75 nomobile" aria-hidden="true">
                        |
                    </span>
                    <span className="opacity-50 automobile">{c('Info').jt`Version ${appVersion}`}</span>
                </footer>
            </div>
        </div>
    );
};

export default AccountPublicLayout;
