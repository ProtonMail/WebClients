import { ReactNode } from 'react';

import { c } from 'ttag';

import { ButtonLike, Href } from '@proton/atoms';
import {
    AppLink,
    CalendarLogo,
    DriveLogo,
    Logo,
    MailLogo,
    PublicTopBanners,
    VpnLogo,
    getAppVersion,
    useConfig,
} from '@proton/components';
import {
    APP_NAMES,
    BRAND_NAME,
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
    const size = 48;

    return (
        <div className="flex-no-min-children flex-nowrap flex-column h-full eo-layout-bg scroll-if-needed">
            <PublicTopBanners />
            <header className="flex flex-nowrap flex-justify-space-between flex-align-items-center flex-item-noshrink p-7 on-tiny-mobile-flex-column">
                <AppLink to="/" toApp={toApp} target="_self">
                    <Logo appName={toApp} />
                </AppLink>
                <div className="flex flex-nowrap flex-align-items-center on-mobile-flex-column">
                    <div className="ml-0 md:ml-4">
                        <Href href="/signup" target="_self">
                            <ButtonLike className="text-semibold" shape="outline" color="norm" pill>{c('Link')
                                .t`Sign up for free`}</ButtonLike>
                        </Href>
                    </div>
                </div>
            </header>
            <div className="eo-layout-container sm:mx-7 flex-item-fluid flex flex-nowrap flex-column">
                <div>{children}</div>
                <div className="mx-auto mt-8">
                    <Href
                        href={getStaticURL('/mail')}
                        className="inline-block m-0 md:mx-2 w-1/4 sm:w-auto"
                        title={MAIL_APP_NAME}
                    >
                        <MailLogo variant="glyph-only" size={size} />
                    </Href>
                    <Href
                        href={getStaticURL('/calendar')}
                        className="inline-block m-0 md:mx-2 w-1/4 sm:w-auto"
                        title={CALENDAR_APP_NAME}
                    >
                        <CalendarLogo variant="glyph-only" size={size} />
                    </Href>
                    <Href
                        href={getStaticURL('/drive')}
                        className="inline-block m-0 md:mx-2 w-1/4 sm:w-auto"
                        title={DRIVE_APP_NAME}
                    >
                        <DriveLogo variant="glyph-only" size={size} />
                    </Href>
                    <Href
                        href="https://protonvpn.com"
                        className="inline-block m-0 md:mx-2 w-1/4 sm:w-auto"
                        title={VPN_APP_NAME}
                    >
                        <VpnLogo variant="glyph-only" size={size} />
                    </Href>
                </div>
            </div>
            <footer className="flex-item-noshrink text-center p-4">
                <div>
                    {
                        // translator: full sentence 'Proton. Privacy by default.'
                        c('Footer').t`${BRAND_NAME}. Privacy by default.`
                    }
                </div>
                <div className="text-center text-sm m-0 pt-4 pb-2 flex-item-noshrink">
                    <span className="block md:inline">{termsLink}</span>
                    <span className="color-weak px-3 hidden md:inline" aria-hidden="true">
                        |
                    </span>
                    <span className="block md:inline">{privacyLink}</span>
                    <span className="color-weak px-3 hidden md:inline" aria-hidden="true">
                        |
                    </span>
                    <span className="block md:inline">{c('Info').jt`Version ${appVersion}`}</span>
                    <span className="color-weak px-3 hidden md:inline" aria-hidden="true">
                        |
                    </span>
                    {hasLanguageSelect && (
                        <span className="block md:inline-flex">
                            <LanguageSelect className="align-baseline color-primary mx-auto" locales={locales} />
                        </span>
                    )}
                </div>
            </footer>
        </div>
    );
};

export default EOLayout;
