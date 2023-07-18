import { ReactNode } from 'react';

import { c } from 'ttag';

import { PublicTopBanners } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import LayoutLogosV2 from '../public/LayoutLogosV2';
import Box from './Box';
import LayoutHeader from './LayoutHeader';

import './Layout.scss';

export interface Props {
    logo: ReactNode;
    children: ReactNode;
    bottomRight?: ReactNode;
    hasDecoration?: boolean;
    headerClassName?: string;
    languageSelect?: boolean;
    onBack?: () => void;
    className?: string;
}

const Layout = ({
    logo,
    children,
    hasDecoration,
    headerClassName,
    languageSelect = true,
    onBack,
    bottomRight,
    className,
}: Props) => {
    return (
        <div
            className={clsx(
                'flex-no-min-children flex-nowrap flex-column h100 signup-v2-bg scroll-if-needed relative',
                className
            )}
        >
            <PublicTopBanners />
            <LayoutHeader
                hasDecoration={hasDecoration}
                className={headerClassName}
                onBack={onBack}
                languageSelect={languageSelect}
                logo={logo}
            />
            <div className="flex-item-fluid-auto flex flex-nowrap flex-column flex-justify-space-between md:mx-4 mx-2">
                <div className="mx-4">
                    {children}
                    {hasDecoration && (
                        <div className="flex flex-align-items-center flex-column">
                            <Box
                                className="h-custom pb-8 w100 flex flex-align-items-end"
                                style={{ '--h-custom': '12rem' }}
                            >
                                <div className="flex flex-justify-space-between w100 on-mobile-flex-column">
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
                                </div>
                            </Box>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Layout;
