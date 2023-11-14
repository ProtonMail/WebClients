import { ReactNode } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { ProtonLogo, PublicTopBanners, getAppVersion, useConfig } from '@proton/components';
import ElectronDraggeableHeaderWrapper from '@proton/components/components/electron/ElectronDraggeableHeaderWrapper';
import { APPS } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';
import { locales } from '@proton/shared/lib/i18n/locales';
import clsx from '@proton/utils/clsx';

import BackButton from './BackButton';
import LanguageSelect from './LanguageSelect';
import LayoutFooter from './LayoutFooter';
import LayoutLogos from './LayoutLogos';

import './Layout.scss';

export interface Props {
    children: ReactNode;
    hasFooter?: boolean;
    bottomRight?: ReactNode;
    hasDecoration?: boolean;
    onBack?: () => void;
    hasWelcome?: boolean;
    headerClassName?: string;
    stepper?: ReactNode;
}

const Layout = ({ children, stepper, hasDecoration, bottomRight, onBack, headerClassName }: Props) => {
    const { APP_VERSION, APP_NAME } = useConfig();
    const appVersion = getAppVersion(APP_VERSION);
    const version = appVersion; // only to avoid duplicate strings for L10N
    const protonLogoBrand = <ProtonLogo variant="full" className={clsx(onBack && 'ml-4 md:ml-0')} />; // for the future: color="invert" will change color to white

    return (
        <div className="flex-no-min-children flex-nowrap flex-column h-full scroll-if-needed relative sign-layout-bg">
            <PublicTopBanners />
            <ElectronDraggeableHeaderWrapper />
            <header
                className={clsx(
                    headerClassName,
                    'sign-layout-main-header gap-1 sm:gap-4 px-6 py-3 lg:px-12 md:pt-5 md:pb-10 mb-2 md:mb-0'
                )}
            >
                <div className="inline-flex flex-nowrap flex-item-noshrink">
                    <div className="no-desktop no-tablet flex-item-noshrink">
                        {onBack && <BackButton onClick={onBack} />}
                    </div>
                    {hasDecoration ? (
                        <Href
                            className="flex-item-noshrink relative interactive-pseudo-protrude rounded interactive--no-background"
                            href={APP_NAME === APPS.PROTONVPN_SETTINGS ? 'https://protonvpn.com ' : getStaticURL('')}
                        >
                            {protonLogoBrand}
                        </Href>
                    ) : (
                        <div className="flex-item-noshrink">{protonLogoBrand}</div>
                    )}
                </div>
                <div>
                    <div className="hidden md:block">{stepper}</div>
                </div>
                <div>
                    {hasDecoration && (
                        <LanguageSelect
                            className="signup-link mr-custom"
                            style={{ '--mr-custom': 'calc(var(--space-3) * -1)' }}
                            globe
                            locales={locales}
                        />
                    )}
                </div>
            </header>
            <div className="sign-layout-container p-0 sm:px-6 flex flex-nowrap flex-column flex-justify-space-between">
                <main>
                    {children}
                    {hasDecoration && (
                        <div className="flex-item-noshrink text-center px-4 pt-0 pb-0 sm:px-5 sm:pt-8 sm:pb-0">
                            <LayoutLogos size={48} />
                        </div>
                    )}
                </main>
            </div>
            {hasDecoration ? (
                <>
                    <LayoutFooter app={APP_NAME} className="flex-item-noshrink text-center p-4" version={appVersion} />
                    <div className="static lg:fixed m-0 lg:m-8 lg:mr-12 mb-4 lg:mb-12 bottom right text-center lg:text-right text-sm sm:text-rg">
                        {bottomRight}
                    </div>
                    <p
                        data-testid="layout-footer:version-text"
                        className="hidden auto-tiny-mobile text-center text-sm m-2 mb-4"
                    >{c('Info').jt`Version ${version}`}</p>
                </>
            ) : (
                <footer className="pt-0 md:pt-7" />
            )}
        </div>
    );
};

export default Layout;
