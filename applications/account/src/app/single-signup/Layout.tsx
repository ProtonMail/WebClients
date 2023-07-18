import { ReactNode } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { PublicTopBanners, VpnLogo, useConfig } from '@proton/components';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import LayoutLogosV2 from '../public/LayoutLogosV2';
import Box from '../single-signup-v2/Box';
import LayoutHeader from '../single-signup-v2/LayoutHeader';

import './Layout.scss';

export interface Props {
    children: ReactNode;
    bottomRight?: ReactNode;
    hasDecoration?: boolean;
    headerClassName?: string;
    languageSelect?: boolean;
    onBack?: () => void;
    className?: string;
}

const Layout = ({
    className,
    children,
    hasDecoration,
    bottomRight,
    headerClassName,
    languageSelect = true,
    onBack,
}: Props) => {
    const { APP_NAME } = useConfig();

    const protonLogo = <VpnLogo variant="with-wordmark" />;

    return (
        <div
            className={clsx(
                'flex-no-min-children flex-nowrap flex-column h100 signup-v1-bg scroll-if-needed relative',
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
                    hasDecoration ? (
                        <Href
                            className="flex-item-noshrink relative interactive-pseudo-protrude rounded interactive--no-background"
                            href={APP_NAME === APPS.PROTONVPN_SETTINGS ? 'https://protonvpn.com ' : getStaticURL('')}
                        >
                            {protonLogo}
                        </Href>
                    ) : (
                        <div className="flex-item-noshrink">{protonLogo}</div>
                    )
                }
            />
            <main className="flex-item-fluid-auto flex flex-nowrap flex-column flex-justify-space-between md:mx-12 mx-6">
                <div>
                    {children}
                    {hasDecoration && (
                        <div className="flex flex-align-items-center flex-column">
                            <Box
                                className="h-custom pb-8 w100 flex flex-align-items-end"
                                style={{ '--h-custom': '12rem' }}
                            >
                                <footer className="flex flex-justify-space-between w100 on-mobile-flex-column">
                                    <div className="flex gap-1 flex-column on-mobile-flex-column">
                                        <LayoutLogosV2 size={20} className="on-mobile-flex-justify-center" />
                                        <span className="text-sm color-weak on-mobile-text-center mb-4 lg:mb-0">
                                            {
                                                // translator: full sentence 'Proton. Privacy by default.'
                                                c('Footer').t`${BRAND_NAME}. Privacy by default.`
                                            }
                                        </span>
                                    </div>
                                    {bottomRight}
                                </footer>
                            </Box>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Layout;
