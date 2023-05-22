import { ReactNode } from 'react';

import { c } from 'ttag';

import { PublicTopBanners } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { locales } from '@proton/shared/lib/i18n/locales';
import clsx from '@proton/utils/clsx';

import BackButton from '../public/BackButton';
import LanguageSelect from '../public/LanguageSelect';
import LayoutLogosV2 from '../public/LayoutLogosV2';
import Box from './Box';

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
            <header
                className={clsx(
                    headerClassName,
                    'flex flex-justify-space-between flex-align-items-center flex-item-noshrink flex-nowrap signup-v2-header gap-1 md:px-8 md:py-6 py-4 px-3'
                )}
            >
                <div className="inline-flex flex-nowrap flex-item-noshrink">
                    <div className="no-desktop no-tablet flex-item-noshrink mr-2">
                        {onBack && <BackButton onClick={onBack} />}
                    </div>
                    <div className="flex-item-noshrink">{logo}</div>
                </div>
                {hasDecoration && languageSelect && (
                    <LanguageSelect className="max-w100 ml-4" globe locales={locales} />
                )}
            </header>
            <div className="pricing-container flex-item-fluid-auto flex flex-nowrap flex-column flex-justify-space-between md:mx-4 mx-2">
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
