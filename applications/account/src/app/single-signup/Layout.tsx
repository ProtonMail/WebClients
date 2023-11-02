import { ReactNode } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import {
    ProtonForBusinessLogo,
    PublicTopBanners,
    VpnForBusinessLogo,
    VpnLogo,
    useActiveBreakpoint,
    useConfig,
} from '@proton/components';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import LayoutLogosV2 from '../public/LayoutLogosV2';
import Box from '../single-signup-v2/Box';
import LayoutHeader from '../single-signup-v2/LayoutHeader';

import './Layout.scss';

export type Background = 'dark' | 'bf2023';

export interface Props {
    children: ReactNode;
    bottomRight?: ReactNode;
    hasDecoration?: boolean;
    headerClassName?: string;
    languageSelect?: boolean;
    onBack?: () => void;
    className?: string;
    background?: Background;
    isB2bPlan?: boolean;
    footer?: ReactNode;
}

const Layout = ({
    className,
    children,
    hasDecoration,
    bottomRight,
    headerClassName,
    languageSelect = true,
    onBack,
    background,
    isB2bPlan,
    footer,
}: Props) => {
    const { APP_NAME } = useConfig();
    const { isTinyMobile } = useActiveBreakpoint();

    const isDarkBg = ['bf2023', 'dark'].includes(background as any);
    const protonLogo = isB2bPlan ? (
        <>
            <ProtonForBusinessLogo className="proton-for-business-logo" />
            <VpnForBusinessLogo className="vpn-for-business-logo" />
        </>
    ) : (
        <VpnLogo className={clsx(isDarkBg && 'vpn-logo--light', 'vpn-logo')} variant="with-wordmark" />
    );

    const href = (() => {
        if (APP_NAME !== APPS.PROTONVPN_SETTINGS) {
            return getStaticURL('');
        }

        if (isB2bPlan) {
            return undefined;
        }

        return 'https://protonvpn.com';
    })();

    return (
        <div
            className={clsx(
                'flex-no-min-children flex-nowrap flex-column h-full scroll-if-needed relative',
                background === 'dark'
                    ? 'signup-v1-bg--dark'
                    : background === 'bf2023'
                    ? 'signup-v1-bg--bf2023'
                    : 'signup-v1-bg',
                className
            )}
        >
            <PublicTopBanners />
            <LayoutHeader
                className={headerClassName}
                languageSelect={languageSelect}
                hasDecoration={hasDecoration}
                onBack={onBack}
                logo={
                    hasDecoration && href ? (
                        <Href
                            className="flex-item-noshrink relative interactive-pseudo-protrude rounded interactive--no-background"
                            href={href}
                        >
                            {protonLogo}
                        </Href>
                    ) : (
                        <div className="flex-item-noshrink flex flex-align-item-center">{protonLogo}</div>
                    )
                }
                isDarkBg={isDarkBg && !isTinyMobile}
            />
            <main className="flex-item-fluid-auto flex flex-nowrap flex-column flex-justify-space-between md:mx-12 mx-6">
                {children}
                {hasDecoration && (
                    <div className="flex flex-align-items-center flex-column">
                        <Box className="w-full">
                            <footer
                                className="w-full min-h-custom pb-8 flex flex-column flex-justify-space-between gap-4"
                                style={{ '--min-h-custom': '12rem' }}
                            >
                                <div className="mb-6"></div>
                                {footer}
                                <div className="w-full flex flex-justify-space-between on-mobile-flex-column">
                                    <div className="flex gap-1 flex-column on-mobile-flex-column">
                                        <LayoutLogosV2 size={20} className="on-mobile-flex-justify-center" />
                                        <span
                                            className={clsx(
                                                'text-sm text-center mb-4 lg:mb-0',
                                                isDarkBg && !isTinyMobile ? 'color-norm opacity-70' : 'color-weak'
                                            )}
                                        >
                                            {
                                                // translator: full sentence 'Proton. Privacy by default.'
                                                c('Footer').t`${BRAND_NAME}. Privacy by default.`
                                            }
                                        </span>
                                    </div>
                                    {bottomRight}
                                </div>
                            </footer>
                        </Box>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Layout;
