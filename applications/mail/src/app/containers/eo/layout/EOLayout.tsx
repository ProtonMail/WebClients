import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import {
    AppLink,
    ButtonLike,
    CalendarLogo,
    DriveLogo,
    Href,
    Logo,
    MailLogo,
    PublicTopBanners,
    VpnLogo,
    getAppVersion,
    useConfig,
} from '@proton/components';
import {
    APP_NAMES,
    CALENDAR_APP_NAME,
    DRIVE_APP_NAME,
    MAIL_APP_NAME,
    VPN_APP_NAME,
} from '@proton/shared/lib/constants';
import { getPrivacyPolicyURL, getStaticURL, getTermsURL } from '@proton/shared/lib/helpers/url';
import { locales } from '@proton/shared/lib/i18n/locales';

import LanguageSelect from './EOLanguageSelect';

import './EOLayout.scss';

export interface Props {
    children: ReactNode;
    hasLanguageSelect?: boolean;
    toApp: APP_NAMES;
}

const EOLayout = ({ children, toApp, hasLanguageSelect = true }: Props) => {
    const { APP_VERSION } = useConfig();
    const termsLink = <Href key="terms" className="eo-footer-link" href={getTermsURL()}>{c('Link').t`Terms`}</Href>;
    const privacyLink = (
        <Href key="privacy" className="eo-footer-link" href={getPrivacyPolicyURL()}>{c('Link').t`Privacy policy`}</Href>
    );

    const appVersion = getAppVersion(APP_VERSION);
    const size = 70;

    return (
        <div className="flex-no-min-children flex-nowrap flex-column h100 eo-layout-bg scroll-if-needed">
            <PublicTopBanners />
            <header className="flex flex-nowrap flex-justify-space-between flex-align-items-center flex-item-noshrink p2 on-tiny-mobile-flex-column">
                <AppLink to="/" toApp={toApp} target="_self">
                    <Logo appName={toApp} />
                </AppLink>
                <div className="flex flex-nowrap flex-align-items-center on-mobile-flex-column">
                    <div className="ml1 on-mobile-ml0">
                        <ButtonLike
                            className="text-semibold"
                            shape="outline"
                            color="norm"
                            pill
                            as={Link}
                            to="/signup"
                        >{c('Link').t`Sign up for free`}</ButtonLike>
                    </div>
                </div>
            </header>
            <div className="pl2 pr2 eo-layout-container flex-item-fluid flex flex-nowrap flex-column">
                <div>{children}</div>
                <div className="center mt2">
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
            </div>
            <footer className="flex-item-noshrink text-center p1">
                <div className="auto-mobile">{c('Info').t`Based in Switzerland, available globally`}</div>
                <div className="text-center text-sm m0 pt1 pb0-5 flex-item-noshrink">
                    <span className="auto-mobile">{termsLink}</span>
                    <span className="color-weak pl0-75 pr0-75 no-mobile" aria-hidden="true">
                        |
                    </span>
                    <span className="auto-mobile">{privacyLink}</span>
                    <span className="color-weak pl0-75 pr0-75 no-mobile" aria-hidden="true">
                        |
                    </span>
                    <span className="auto-mobile">{c('Info').jt`Version ${appVersion}`}</span>
                    <span className="color-weak pl0-75 pr0-75 no-mobile" aria-hidden="true">
                        |
                    </span>
                    {hasLanguageSelect && (
                        <span className="auto-mobile inline-flex">
                            <LanguageSelect className="align-baseline color-primary center" locales={locales} />
                        </span>
                    )}
                </div>
            </footer>
        </div>
    );
};

export default EOLayout;
