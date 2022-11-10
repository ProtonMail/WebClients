import { ReactNode } from 'react';

import { c } from 'ttag';

import { Href, ProtonLogo, PublicTopBanners, classnames, getAppVersion, useConfig } from '@proton/components';
import NudgeTopBanner, { getIsProtonMailDomain } from '@proton/components/containers/topBanners/NudgeTopBanner';
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
}

const Layout = ({ children, hasWelcome, hasDecoration, bottomRight, onBack, headerClassName }: Props) => {
    const { APP_VERSION, APP_NAME } = useConfig();
    const appVersion = getAppVersion(APP_VERSION);
    const version = appVersion; // only to avoid duplicate strings for L10N

    const welcome = getIsProtonMailDomain() ? <NudgeTopBanner /> : null;

    return (
        <div className="flex-no-min-children flex-nowrap flex-column h100 sign-layout-bg scroll-if-needed relative">
            <PublicTopBanners>{hasWelcome ? welcome : null}</PublicTopBanners>
            <header
                className={clsx(
                    headerClassName,
                    'sign-layout-logo flex flex-justify-space-between flex-align-items-center flex-item-noshrink flex-nowrap flex-gap-0-5'
                )}
            >
                <div className="inline-flex flex-nowrap flex-item-noshrink">
                    <div className="no-desktop no-tablet flex-item-noshrink">
                        {onBack && <BackButton onClick={onBack} />}
                    </div>
                    <Href
                        className="flex-item-noshrink"
                        href={APP_NAME === APPS.PROTONVPN_SETTINGS ? 'https://protonvpn.com ' : getStaticURL('')}
                    >
                        <ProtonLogo variant="full" className={classnames([onBack && 'on-mobile-ml1'])} />
                    </Href>
                </div>
                {hasDecoration && <LanguageSelect className="max-w100 ml1" outlined globe locales={locales} />}
            </header>
            <div className="sign-layout-container flex-item-fluid-auto flex flex-nowrap flex-column flex-justify-space-between">
                <div>
                    {children}
                    {hasDecoration && (
                        <div className="flex-item-noshrink text-center p1-5 on-mobile-p1 on-mobile-pb0">
                            <LayoutLogos size={48} />
                        </div>
                    )}
                </div>
            </div>
            {hasDecoration ? (
                <>
                    <LayoutFooter
                        app={APP_NAME}
                        className="flex-item-noshrink text-center p1 on-mobile-pt0 on-mobile-pb0"
                        version={appVersion}
                    />
                    <div className="fixed m2 mb1-5 bottom right on-tablet-m0 on-tablet-mb1 on-tablet-text-center on-tablet-static on-tiny-mobile-text-sm">
                        {bottomRight}
                    </div>
                    <p className="hidden auto-tiny-mobile text-center text-sm m0-5 mb1">{c('Info')
                        .jt`Version ${version}`}</p>
                </>
            ) : (
                <footer className="pt2 on-mobile-pt0" />
            )}
        </div>
    );
};

export default Layout;
