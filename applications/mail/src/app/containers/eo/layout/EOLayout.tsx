import type { ReactNode } from 'react';

import { c } from 'ttag';

import { ButtonLike, Href } from '@proton/atoms';
import {
    AppLink,
    CalendarLogo,
    DriveLogo,
    Logo,
    MailLogo,
    PassLogo,
    PublicTopBanners,
    VpnLogo,
    getAppVersion,
    useConfig,
} from '@proton/components';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import {
    BRAND_NAME,
    CALENDAR_APP_NAME,
    DRIVE_APP_NAME,
    MAIL_APP_NAME,
    PASS_APP_NAME,
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
    const termsLink = (
        <Href key="terms" className="eo-footer-link" href={getTermsURL(APPS.PROTONMAIL)}>{c('Link').t`Terms`}</Href>
    );
    const privacyLink = (
        <Href key="privacy" className="eo-footer-link" href={getPrivacyPolicyURL()}>{c('Link').t`Privacy policy`}</Href>
    );

    const appVersion = getAppVersion(APP_VERSION);
    const size = 12;

    return (
        <div className="flex *:min-size-auto flex-nowrap flex-column h-full eo-layout-bg overflow-auto">
            <PublicTopBanners />
            <header className="flex flex-nowrap justify-space-between items-center shrink-0 p-7 flex-column sm:flex-row">
                <AppLink to="/" toApp={toApp} target="_self" reloadDocument>
                    <Logo appName={toApp} />
                </AppLink>
                <div className="flex flex-nowrap items-center flex-column md:flex-row">
                    <div className="ml-0 md:ml-4">
                        <Href href="/signup" target="_self">
                            <ButtonLike className="text-semibold" shape="outline" color="norm" pill>{c('Link')
                                .t`Sign up for free`}</ButtonLike>
                        </Href>
                    </div>
                </div>
            </header>
            <div className="eo-layout-container sm:mx-7 flex-1 flex flex-nowrap flex-column">
                <div>{children}</div>
                <div className="mx-auto mt-8">
                    <Href
                        href={getStaticURL('/mail')}
                        className="inline-block m-0 md:mx-2 w-1/5 sm:w-auto"
                        title={MAIL_APP_NAME}
                    >
                        <MailLogo variant="glyph-only" size={size} />
                    </Href>
                    <Href
                        href={getStaticURL('/calendar')}
                        className="inline-block m-0 md:mx-2 w-1/5 sm:w-auto"
                        title={CALENDAR_APP_NAME}
                    >
                        <CalendarLogo variant="glyph-only" size={size} />
                    </Href>
                    <Href
                        href={getStaticURL('/drive')}
                        className="inline-block m-0 md:mx-2 w-1/5 sm:w-auto"
                        title={DRIVE_APP_NAME}
                    >
                        <DriveLogo variant="glyph-only" size={size} />
                    </Href>
                    <Href
                        href="https://protonvpn.com"
                        className="inline-block m-0 md:mx-2 w-1/5 sm:w-auto"
                        title={VPN_APP_NAME}
                    >
                        <VpnLogo variant="glyph-only" size={size} />
                    </Href>
                    <Href
                        href={getStaticURL('/pass')}
                        className="inline-block m-0 md:mx-2 w-1/5 sm:w-auto"
                        title={PASS_APP_NAME}
                    >
                        <PassLogo variant="glyph-only" size={size} />
                    </Href>
                </div>
            </div>
            <footer className="shrink-0 text-center p-4">
                <div>
                    {
                        // translator: full sentence 'Proton. Privacy by default.'
                        c('Footer').t`${BRAND_NAME}. Privacy by default.`
                    }
                </div>
                <div className="text-center text-sm m-0 pt-4 pb-2 shrink-0">
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
