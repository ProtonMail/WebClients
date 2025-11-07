import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
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

export type Background = 'dark' | 'bf2025';

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
    headerCenterElement?: ReactNode;
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
    headerCenterElement,
}: Props) => {
    const { APP_NAME } = useConfig();
    const { viewportWidth } = useActiveBreakpoint();

    const isDarkBg = ['bf2025', 'dark'].includes(background as any);
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
                'flex *:min-size-auto flex-nowrap flex-column h-full overflow-auto relative',
                background === 'dark'
                    ? 'signup-v1-bg--dark'
                    : background === 'bf2025'
                      ? 'signup-v1-bg--bf2025'
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
                            className="shrink-0 relative interactive-pseudo-protrude rounded interactive--no-background"
                            href={href}
                        >
                            {protonLogo}
                        </Href>
                    ) : (
                        <div className="shrink-0 flex">{protonLogo}</div>
                    )
                }
                isDarkBg={isDarkBg && !viewportWidth.xsmall}
                centerElement={headerCenterElement}
            />
            <main className="flex-auto flex flex-nowrap flex-column justify-space-between md:mx-12 mx-6">
                {children}
                {hasDecoration && (
                    <div className="flex items-center flex-column">
                        <Box className="w-full">
                            <footer
                                className="w-full min-h-custom pb-8 flex flex-column justify-space-between gap-4"
                                style={{ '--min-h-custom': '12rem' }}
                            >
                                <div className="mb-6"></div>
                                {footer}
                                <div className="w-full flex justify-space-between flex-column md:flex-row">
                                    <div className="flex gap-1 flex-column md:flex-row">
                                        <LayoutLogosV2 size={5} className="justify-center md:justify-start" />
                                        <span
                                            className={clsx(
                                                'text-sm text-center mb-4 lg:mb-0',
                                                isDarkBg && !viewportWidth.xsmall
                                                    ? 'color-norm opacity-70'
                                                    : 'color-weak'
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
