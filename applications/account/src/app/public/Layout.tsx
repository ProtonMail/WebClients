import { ReactNode } from 'react';
import { c } from 'ttag';
import { locales } from '@proton/shared/lib/i18n/locales';
import { getPrivacyPolicyURL, getStaticURL, getTermsURL } from '@proton/shared/lib/helpers/url';
import NudgeTopBanner, { getIsProtonMailDomain } from '@proton/components/containers/topBanners/NudgeTopBanner';
import {
    APP_NAMES,
    APPS,
    CALENDAR_APP_NAME,
    DRIVE_APP_NAME,
    MAIL_APP_NAME,
    VPN_APP_NAME,
} from '@proton/shared/lib/constants';

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
    WelcomeV5TopBanner,
    useActiveBreakpoint,
} from '@proton/components';

import LanguageSelect from './LanguageSelect';

import './Layout.scss';

interface AppLogosProps {
    app: APP_NAMES;
    className: string;
    size: IconSize;
}

const AppLogos = ({ className, size, app }: AppLogosProps) => {
    return (
        <div className={className}>
            {[
                {
                    title: MAIL_APP_NAME,
                    url: app === APPS.PROTONVPN_SETTINGS ? 'https://proton.me/mail' : getStaticURL('/mail'),
                    logo: <MailLogo variant="glyph-only" size={size} />,
                },
                {
                    title: CALENDAR_APP_NAME,
                    url: app === APPS.PROTONVPN_SETTINGS ? 'https://proton.me/calendar' : getStaticURL('/calendar'),
                    logo: <CalendarLogo variant="glyph-only" size={size} />,
                },
                {
                    title: DRIVE_APP_NAME,
                    url: app === APPS.PROTONVPN_SETTINGS ? 'https://proton.me/drive' : getStaticURL('/drive'),
                    logo: <DriveLogo variant="glyph-only" size={size} />,
                },
                {
                    title: VPN_APP_NAME,
                    url: 'https://protonvpn.com',
                    logo: <VpnLogo variant="glyph-only" size={size} />,
                },
            ].map(({ title, url, logo }) => {
                return (
                    <Href
                        key={title}
                        href={url}
                        className="inline-block mx0-5 on-mobile-m0 on-tiny-mobile-w25"
                        title={title}
                    >
                        {logo}
                    </Href>
                );
            })}
        </div>
    );
};

interface FooterProps {
    className: string;
    version: string;
    app: APP_NAMES;
}

const Footer = ({ className, app, version }: FooterProps) => {
    return (
        <footer className={className}>
            <div className="auto-mobile">{c('Info').t`Based in Switzerland, available globally`}</div>
            <div className="text-center text-sm m0 pt1 pb0-5 flex-item-noshrink">
                <span className="auto-tiny-mobile">
                    <Href key="terms" className="signup-footer-link" href={getTermsURL(app)}>{c('Link').t`Terms`}</Href>
                </span>
                <span className="color-border pl0-75 pr0-75 no-tiny-mobile" aria-hidden="true">
                    |
                </span>
                <span className="auto-tiny-mobile">
                    <Href key="privacy" className="signup-footer-link" href={getPrivacyPolicyURL(app)}>{c('Link')
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
    hasWelcome?: boolean;
}

const Layout = ({ children, hasWelcome, hasDecoration, topRight, bottomRight, hasBackButton }: Props) => {
    const { APP_VERSION, APP_NAME } = useConfig();
    const appVersion = getAppVersion(APP_VERSION);
    const { isTinyMobile } = useActiveBreakpoint();

    const welcome = getIsProtonMailDomain() ? <NudgeTopBanner /> : <WelcomeV5TopBanner />;

    return (
        <div className="flex-no-min-children flex-nowrap flex-column h100 sign-layout-bg scroll-if-needed relative">
            <PublicTopBanners>{hasWelcome ? welcome : null}</PublicTopBanners>
            <header className="sign-layout-logo flex flex-justify-space-between flex-align-items-center flex-item-noshrink flex-nowrap flex-gap-0-5">
                <Href
                    className="flex-item-noshrink"
                    href={APP_NAME === APPS.PROTONVPN_SETTINGS ? 'https://protonvpn.com ' : getStaticURL('')}
                >
                    <ProtonLogo
                        variant={hasBackButton && isTinyMobile ? 'glyph-only' : 'full'}
                        className={classnames([hasBackButton && 'on-mobile-ml3-5'])}
                    />
                </Href>
                {topRight}
            </header>
            <div className="sign-layout-container flex-item-fluid-auto flex flex-nowrap flex-column flex-justify-space-between">
                <div>
                    {children}
                    {hasDecoration && (
                        <div className="flex-item-noshrink text-center p1 mt0 on-mobile-m0 on-mobile-pb0">
                            <AppLogos app={APP_NAME} size={70} className="p0-5 on-mobile-p0" />
                        </div>
                    )}
                </div>
            </div>
            {hasDecoration ? (
                <>
                    <Footer
                        app={APP_NAME}
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
