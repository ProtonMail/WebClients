import { ReactNode } from 'react';
import { c } from 'ttag';
import { locales } from '@proton/shared/lib/i18n/locales';

import {
    getAppVersion,
    useConfig,
    PublicTopBanners,
    Href,
    MailLogo,
    CalendarLogo,
    VpnLogo,
    DriveLogo,
    classnames,
    ProtonLogo,
    IconSize,
} from '@proton/components';

import LanguageSelect from './LanguageSelect';

import './Layout.scss';

const AppLogos = ({ className, size }: { className: string; size: IconSize }) => {
    return (
        <div className={className}>
            <MailLogo variant="glyph-only" size={size} className="mx0-5 on-mobile-m0 on-tiny-mobile-w25" />
            <CalendarLogo variant="glyph-only" size={size} className="mx0-5 on-mobile-m0 on-tiny-mobile-w25" />
            <VpnLogo variant="glyph-only" size={size} className="mx0-5 on-mobile-m0 on-tiny-mobile-w25" />
            <DriveLogo variant="glyph-only" size={size} className="mx0-5 on-mobile-m0 on-tiny-mobile-w25" />
        </div>
    );
};

const Footer = ({ className, version }: { className: string; version: string }) => {
    return (
        <footer className={className}>
            <div className="auto-mobile">{c('Info').t`Based in Switzerland, available globally`}</div>
            <div className="text-center text-sm m0 pt1 pb0-5 flex-item-noshrink">
                <span className="auto-tiny-mobile">
                    <Href
                        key="terms"
                        className="signup-footer-link"
                        href="https://protonmail.com/terms-and-conditions"
                    >{c('Link').t`Terms`}</Href>
                </span>
                <span className="color-border pl0-75 pr0-75 no-tiny-mobile" aria-hidden="true">
                    |
                </span>
                <span className="auto-tiny-mobile">
                    <Href key="privacy" className="signup-footer-link" href="https://protonmail.com/privacy-policy">{c(
                        'Link'
                    ).t`Privacy policy`}</Href>
                </span>
                <span className="color-border pl0-75 pr0-75 no-tiny-mobile" aria-hidden="true">
                    |
                </span>
                <span className="auto-tiny-mobile">{c('Info').jt`Version ${version}`}</span>
                <span className="color-border pl0-75 pr0-75 no-tiny-mobile" aria-hidden="true">
                    |
                </span>
                <span className="auto-tiny-mobile">
                    <div className="inline-block">
                        <LanguageSelect className="color-primary" locales={locales} />
                    </div>
                </span>
            </div>
        </footer>
    );
};

export interface Props {
    children: ReactNode;
    hasFooter?: boolean;
    topRight?: ReactNode;
    bottomRight?: ReactNode;
    hasDecoration?: boolean;
    hasBackButton?: boolean;
}

const Layout = ({ children, hasDecoration, topRight, bottomRight, hasBackButton }: Props) => {
    const { APP_VERSION, APP_VERSION_DISPLAY } = useConfig();
    const appVersion = getAppVersion(APP_VERSION_DISPLAY || APP_VERSION);

    return (
        <div className="flex-no-min-children flex-nowrap flex-column h100 sign-layout-bg scroll-if-needed relative">
            <PublicTopBanners />
            <header className="sign-layout-logo flex flex-justify-space-between flex-align-items-center flex-item-noshrink ml2 mr2 mt1 mb2 pb2 on-mobile-m0 on-mobile-pt1 on-mobile-pb1">
                <ProtonLogo className={classnames([hasBackButton && 'on-mobile-ml3-5'])} />
                {topRight}
            </header>
            <div className="sign-layout-container flex-item-fluid-auto flex flex-nowrap flex-column flex-justify-space-between">
                <div>
                    {children}
                    {hasDecoration && (
                        <div className="flex-item-noshrink text-center p1 mt0 on-mobile-m0 on-mobile-pb0">
                            <AppLogos size={70} className="p0-5 on-mobile-p0" />
                        </div>
                    )}
                </div>
            </div>
            {hasDecoration ? (
                <>
                    <Footer
                        className="flex-item-noshrink text-center p1 on-mobile-pt0 on-mobile-pb0"
                        version={appVersion}
                    />
                    <div className="fixed m2 bottom right on-mobile-m0 on-mobile-mb1 on-mobile-text-center on-mobile-static">
                        {bottomRight}
                    </div>
                </>
            ) : (
                <footer className="pt2 on-mobile-pt0" />
            )}
        </div>
    );
};

export default Layout;
