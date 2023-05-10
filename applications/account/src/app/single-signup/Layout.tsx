import { ReactNode } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { PublicTopBanners, VpnLogo, getAppVersion, useConfig } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';
import { locales } from '@proton/shared/lib/i18n/locales';
import clsx from '@proton/utils/clsx';

import BackButton from '../public/BackButton';
import LanguageSelect from '../public/LanguageSelect';
import LayoutFooter from '../public/LayoutFooter';
import LayoutLogos from '../public/LayoutLogos';

import './Layout.scss';

export interface Props {
    children: ReactNode;
    bottomRight?: ReactNode;
    hasDecoration?: boolean;
    headerClassName?: string;
    languageSelect?: boolean;
    onBack?: () => void;
}

const Layout = ({ children, hasDecoration, bottomRight, headerClassName, languageSelect = true, onBack }: Props) => {
    const { APP_VERSION, APP_NAME } = useConfig();
    const appVersion = getAppVersion(APP_VERSION);
    const version = appVersion; // only to avoid duplicate strings for L10N

    const protonLogo = <VpnLogo variant="with-wordmark" />;

    return (
        <div className="flex-no-min-children flex-nowrap flex-column h100 pricing-bg scroll-if-needed relative">
            <PublicTopBanners />
            <header
                className={clsx(
                    headerClassName,
                    'flex flex-justify-space-between flex-align-items-center flex-item-noshrink flex-nowrap gap-1 md:px-11 md:py-6 py-4 px-3 '
                )}
            >
                <div className="inline-flex flex-nowrap flex-item-noshrink">
                    <div className="no-desktop no-tablet flex-item-noshrink mr-2">
                        {onBack && <BackButton onClick={onBack} />}
                    </div>
                    {hasDecoration ? (
                        <Href
                            className="flex-item-noshrink"
                            href={APP_NAME === APPS.PROTONVPN_SETTINGS ? 'https://protonvpn.com ' : getStaticURL('')}
                        >
                            {protonLogo}
                        </Href>
                    ) : (
                        <div className="flex-item-noshrink">{protonLogo}</div>
                    )}
                </div>
                {hasDecoration && languageSelect && (
                    <LanguageSelect className="max-w100 ml-4" globe locales={locales} />
                )}
            </header>
            <div className="pricing-container flex-item-fluid-auto flex flex-nowrap flex-column flex-justify-space-between md:mx-4 mx-2">
                <div>
                    {children}
                    {hasDecoration && (
                        <div className="flex-item-noshrink text-center mt-4 md:p-4">
                            <LayoutLogos size={48} />
                        </div>
                    )}
                </div>
            </div>
            {hasDecoration ? (
                <>
                    <LayoutFooter app={APP_NAME} className="flex-item-noshrink text-center p-4" version={appVersion} />
                    <div className="fixed m-0 lg:m-8 lg:mr-12 mb-4 lg:mb-12 bottom right on-tablet-text-center on-tablet-static on-tiny-mobile-text-sm">
                        {bottomRight}
                    </div>
                    <p
                        data-testid="layout-footer:version-text"
                        className="hidden auto-tiny-mobile text-center text-sm m-0-5 mb-4"
                    >{c('Info').jt`Version ${version}`}</p>
                </>
            ) : (
                <footer className="md:pt-8" />
            )}
        </div>
    );
};

export default Layout;
