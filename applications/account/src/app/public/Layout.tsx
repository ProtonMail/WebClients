import { ReactNode } from 'react';
import { c } from 'ttag';
import { locales } from '@proton/shared/lib/i18n/locales';
import { getPrivacyPolicyURL, getStaticURL, getTermsURL } from '@proton/shared/lib/helpers/url';
import { CALENDAR_APP_NAME, DRIVE_APP_NAME, MAIL_APP_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';

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
            <Href
                href={getStaticURL('/mail')}
                className="inline-block mx0-5 on-mobile-m0 on-tiny-mobile-w25"
                title={MAIL_APP_NAME}
            >
                <MailLogo variant="glyph-only" size={size} />
            </Href>
            <Href
                href={getStaticURL('/calendar')}
                className="inline-block mx0-5 on-mobile-m0 on-tiny-mobile-w25"
                title={CALENDAR_APP_NAME}
            >
                <CalendarLogo variant="glyph-only" size={size} />
            </Href>
            <Href
                href={getStaticURL('/drive')}
                className="inline-block mx0-5 on-mobile-m0 on-tiny-mobile-w25"
                title={DRIVE_APP_NAME}
            >
                <DriveLogo variant="glyph-only" size={size} />
            </Href>
            <Href
                href="https://protonvpn.com"
                className="inline-block mx0-5 on-mobile-m0 on-tiny-mobile-w25"
                title={VPN_APP_NAME}
            >
                <VpnLogo variant="glyph-only" size={size} />
            </Href>
        </div>
    );
};

const Footer = ({ className, version }: { className: string; version: string }) => {
    return (
        <footer className={className}>
            <div className="auto-mobile">{c('Info').t`Based in Switzerland, available globally`}</div>
            <div className="text-center text-sm m0 pt1 pb0-5 flex-item-noshrink">
                <span className="auto-tiny-mobile">
                    <Href key="terms" className="signup-footer-link" href={getTermsURL()}>{c('Link').t`Terms`}</Href>
                </span>
                <span className="color-border pl0-75 pr0-75 no-tiny-mobile" aria-hidden="true">
                    |
                </span>
                <span className="auto-tiny-mobile">
                    <Href key="privacy" className="signup-footer-link" href={getPrivacyPolicyURL()}>{c('Link')
                        .t`Privacy policy`}</Href>
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
    const { APP_VERSION } = useConfig();
    const appVersion = getAppVersion(APP_VERSION);

    return (
        <div className="flex-no-min-children flex-nowrap flex-column h100 sign-layout-bg scroll-if-needed relative">
            <PublicTopBanners />
            <header className="sign-layout-logo flex flex-justify-space-between flex-align-items-center flex-item-noshrink ml2 mr2 mt1 mb2 pb2 on-mobile-m0 on-mobile-pt1 on-mobile-pb1">
                <Href href={getStaticURL('')}>
                    <ProtonLogo className={classnames([hasBackButton && 'on-mobile-ml3-5'])} />
                </Href>
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
                    <div className="fixed m2 mb1-5 bottom right on-tablet-m0 on-tablet-mb1 on-tablet-text-center on-tablet-static">
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
