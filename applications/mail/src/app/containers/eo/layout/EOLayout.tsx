import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { c } from 'ttag';
import { locales } from '@proton/shared/lib/i18n/locales';
import { APP_NAMES } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import {
    getAppVersion,
    useConfig,
    PublicTopBanners,
    Href,
    Logo,
    AppLink,
    ButtonLike,
    MailLogo,
    CalendarLogo,
    VpnLogo,
    DriveLogo,
} from '@proton/components';

import LanguageSelect from './EOLanguageSelect';

import './EOLayout.scss';

export interface Props {
    children: ReactNode;
    hasLanguageSelect?: boolean;
    toApp: APP_NAMES;
}

const EOLayout = ({ children, toApp, hasLanguageSelect = true }: Props) => {
    const { APP_VERSION } = useConfig();
    const termsLink = (
        <Href key="terms" className="eo-footer-link" href={getStaticURL('/terms-and-conditions')}>{c('Link')
            .t`Terms`}</Href>
    );
    const privacyLink = (
        <Href key="privacy" className="eo-footer-link" href={getStaticURL('/privacy-policy')}>{c('Link')
            .t`Privacy policy`}</Href>
    );
    const OldVersionLink = (
        <Href key="oldVersion" className="eo-footer-link" href="https://old.protonmail.com/">{c('Link')
            .t`Previous version`}</Href>
    );

    const appVersion = getAppVersion(APP_VERSION);

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
                    <MailLogo variant="glyph-only" size={70} className="mx0-5 on-mobile-m0 on-tiny-mobile-w25" />
                    <CalendarLogo variant="glyph-only" size={70} className="mx0-5 on-mobile-m0 on-tiny-mobile-w25" />
                    <DriveLogo variant="glyph-only" size={70} className="mx0-5 on-mobile-m0 on-tiny-mobile-w25" />
                    <VpnLogo variant="glyph-only" size={70} className="mx0-5 on-mobile-m0 on-tiny-mobile-w25" />
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
                    <span className="auto-mobile">{OldVersionLink}</span>
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
