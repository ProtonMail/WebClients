import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { Logo, ProtonLogo, PublicTopBanners, getAppVersion, useConfig, useTheme } from '@proton/components';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { addDesktopAppVersion } from '@proton/shared/lib/desktop/version';
import { isElectronApp, isElectronMail, isElectronOnMac } from '@proton/shared/lib/helpers/desktop';
import { getStaticURL } from '@proton/shared/lib/helpers/url';
import { locales } from '@proton/shared/lib/i18n/locales';
import clsx from '@proton/utils/clsx';

import { ThemeToggleDropdown } from '../content/theme/ThemeToggleDropdown';
import BackButton from './BackButton';
import LanguageSelect from './LanguageSelect';
import LayoutFooter from './LayoutFooter';
import LayoutLogos from './LayoutLogos';

import './Layout.scss';

export interface Props {
    children: ReactNode;
    hasFooter?: boolean;
    bottomRight?: ReactNode;
    topRight?: ReactNode;
    hasDecoration?: boolean;
    hasThemeToggle?: boolean;
    onBack?: () => void;
    hasWelcome?: boolean;
    headerClassName?: string;
    stepper?: ReactNode;
    centeredContent?: boolean;
    layoutClassName?: string;
    toApp: APP_NAMES | undefined;
}

const getStaticAppUrl = (appName: APP_NAMES | undefined) => {
    switch (appName) {
        case APPS.PROTONVPN_SETTINGS:
            return 'https://protonvpn.com';
        case APPS.PROTONMAIL:
            return getStaticURL('/mail');
        case APPS.PROTONCALENDAR:
            return getStaticURL('/calendar');
        case APPS.PROTONDRIVE:
            return getStaticURL('/drive');
        case APPS.PROTONWALLET:
            return getStaticURL('/wallet');
        case APPS.PROTONDOCS:
            return getStaticURL('/drive');
        case APPS.PROTONPASS:
            return getStaticURL('/pass');
        default:
            return getStaticURL('');
    }
};

const Layout = ({
    toApp,
    children,
    stepper,
    hasDecoration,
    bottomRight,
    onBack,
    headerClassName,
    centeredContent,
    layoutClassName,
    topRight,
    hasThemeToggle = true,
}: Props) => {
    const { APP_VERSION, APP_NAME } = useConfig();
    const appVersion = getAppVersion(APP_VERSION);
    const version = isElectronMail ? addDesktopAppVersion(appVersion) : appVersion; // only to avoid duplicate strings for L10N

    const theme = useTheme();

    const protonLogo = (
        <ProtonLogo color={theme.information.dark ? 'invert' : undefined} className={clsx(onBack && 'ml-4 md:ml-0')} />
    );

    const protonLogoBrand = (() => {
        if (toApp === APPS.PROTONLUMO) {
            return (
                <Logo
                    appName={toApp}
                    variant="wordmark-only"
                    className={clsx(onBack && 'ml-4 md:ml-0')}
                    fallback={protonLogo}
                />
            );
        }

        if (toApp) {
            return (
                <Logo
                    appName={toApp}
                    color={theme.information.dark ? 'invert' : undefined}
                    className={clsx(onBack && 'ml-4 md:ml-0')}
                    fallback={protonLogo}
                />
            );
        }

        return protonLogo;
    })();

    return (
        <div
            className={clsx(
                'flex *:min-size-auto flex-nowrap flex-column h-full overflow-auto relative ui-standard sign-layout-bg',
                layoutClassName
            )}
        >
            <PublicTopBanners />
            <header
                className={clsx(
                    headerClassName,
                    'sign-layout-main-header gap-2 sm:gap-4 px-4 sm:px-6 py-3 lg:px-12 md:pt-5 md:pb-10 mb-2 md:mb-0',
                    stepper ? 'sign-layout-main-header-grid' : undefined
                )}
            >
                <div className="inline-flex flex-nowrap shrink-0">
                    <div className={clsx('md:hidden shrink-0', isElectronOnMac && 'pl-14 md:pl-0')}>
                        {onBack && <BackButton onClick={onBack} />}
                    </div>
                    {hasDecoration ? (
                        <Href
                            className={clsx(
                                'shrink-0 relative interactive-pseudo-protrude rounded interactive--no-background',
                                isElectronOnMac && 'md:pl-14 lg:pl-8'
                            )}
                            href={getStaticAppUrl(toApp)}
                        >
                            {protonLogoBrand}
                        </Href>
                    ) : (
                        <div className={clsx('shrink-0', isElectronOnMac && 'md:pl-14 lg:pl-8')}>{protonLogoBrand}</div>
                    )}
                </div>
                {stepper && (
                    <div>
                        <div className="hidden md:block">{stepper}</div>
                    </div>
                )}
                <div className="flex items-center gap-1 flex-nowrap">
                    {topRight || (hasDecoration && <LanguageSelect className="signup-link" globe locales={locales} />)}
                    {hasThemeToggle && !isElectronApp && <ThemeToggleDropdown />}
                </div>
            </header>
            <div
                className={clsx(
                    'sign-layout-container p-0 sm:px-6 flex flex-nowrap flex-column justify-space-between',
                    centeredContent && 'absolute h-full w-full'
                )}
            >
                <main className={clsx(centeredContent && 'flex self-center my-auto')}>
                    {children}
                    {hasDecoration && (
                        <div className="shrink-0 text-center px-4 pt-0 pb-0 sm:px-5 sm:pt-8 sm:pb-0">
                            <LayoutLogos size={7} />
                        </div>
                    )}
                </main>
            </div>
            {hasDecoration ? (
                <>
                    <LayoutFooter app={toApp || APP_NAME} className="shrink-0 text-center p-4" version={version} />
                    <div className="static lg:fixed m-0 lg:m-8 lg:mr-12 mb-4 lg:mb-12 bottom-0 right-0 text-center lg:text-right">
                        {bottomRight}
                    </div>
                    <p
                        data-testid="layout-footer:version-text"
                        className="block sm:hidden text-center text-sm m-2 mb-4"
                    >{c('Info').jt`Version ${version}`}</p>
                </>
            ) : (
                <footer className={clsx('pt-0', centeredContent ? 'md:pt-0' : 'md:pt-7')} />
            )}
        </div>
    );
};

export default Layout;
