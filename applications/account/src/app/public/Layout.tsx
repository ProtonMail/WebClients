import { ReactNode } from 'react';

import {
    Href,
    ProtonLogo,
    PublicTopBanners,
    classnames,
    getAppVersion,
    useActiveBreakpoint,
    useConfig,
} from '@proton/components';
import NudgeTopBanner, { getIsProtonMailDomain } from '@proton/components/containers/topBanners/NudgeTopBanner';
import { APPS } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';
import { locales } from '@proton/shared/lib/i18n/locales';
import clsx from '@proton/utils/clsx';

import LanguageSelect from './LanguageSelect';
import LayoutFooter from './LayoutFooter';
import LayoutLogos from './LayoutLogos';

import './Layout.scss';

export interface Props {
    children: ReactNode;
    hasFooter?: boolean;
    bottomRight?: ReactNode;
    hasDecoration?: boolean;
    hasBackButton?: boolean;
    hasWelcome?: boolean;
    headerClassName?: string;
}

const Layout = ({ children, hasWelcome, hasDecoration, bottomRight, hasBackButton, headerClassName }: Props) => {
    const { APP_VERSION, APP_NAME } = useConfig();
    const appVersion = getAppVersion(APP_VERSION);
    const { isTinyMobile } = useActiveBreakpoint();

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
                <Href
                    className="flex-item-noshrink"
                    href={APP_NAME === APPS.PROTONVPN_SETTINGS ? 'https://protonvpn.com ' : getStaticURL('')}
                >
                    <ProtonLogo
                        variant={hasBackButton && isTinyMobile ? 'glyph-only' : 'full'}
                        className={classnames([hasBackButton && 'on-mobile-ml3-5'])}
                    />
                </Href>
                {hasDecoration && <LanguageSelect outlined globe locales={locales} />}
            </header>
            <div className="sign-layout-container flex-item-fluid-auto flex flex-nowrap flex-column flex-justify-space-between">
                <div>
                    {children}
                    {hasDecoration && (
                        <div className="flex-item-noshrink text-center p1-5 on-mobile-p1 on-mobile-pb0">
                            <LayoutLogos size={70} />
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
