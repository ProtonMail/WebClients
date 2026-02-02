import type { CSSProperties, ReactNode } from 'react';

import { c } from 'ttag';

import { PublicTopBanners } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import LayoutLogosV2 from '../public/LayoutLogosV2';
import Box from './Box';
import LayoutHeader from './LayoutHeader';
import { useSignupV2Theme } from './SignupV2ThemeProvider';

import './Layout.scss';

export interface Props {
    logo: ReactNode;
    children: ReactNode;
    bottomRight?: ReactNode;
    hasDecoration?: boolean;
    headerClassName?: string;
    languageSelect?: boolean;
    headerCenterElement?: ReactNode;
    onBack?: () => void;
    className?: string;
    footer?: ReactNode;
    footerWidth?: CSSProperties;
}

const Layout = ({
    footer,
    footerWidth,
    logo,
    children,
    hasDecoration,
    headerClassName,
    languageSelect = true,
    headerCenterElement,
    onBack,
    bottomRight,
    className,
}: Props) => {
    const signupV2Theme = useSignupV2Theme();
    return (
        <div
            className={clsx(
                'flex *:min-size-auto flex-nowrap flex-column h-full overflow-auto relative signup-v2-wrapper',
                signupV2Theme.background === 'bf' && 'signup-v2-bg--bf2025',
                signupV2Theme.background === 'b2b' && 'signup-v2-bg--b2b',
                signupV2Theme.layout.className,
                !signupV2Theme.background && 'signup-v2-bg',
                signupV2Theme.intent && `signup-v2-bg--${signupV2Theme.intent.replace('proton-', '')}`,
                className
            )}
        >
            <PublicTopBanners />
            <LayoutHeader
                isDarkBg={signupV2Theme.dark}
                hasDecoration={hasDecoration}
                className={headerClassName}
                onBack={onBack}
                languageSelect={languageSelect}
                logo={logo}
                centerElement={headerCenterElement}
            />
            <div className="flex-auto flex flex-nowrap flex-column justify-space-between mx-6">
                {children}
                {hasDecoration && (
                    <div className="flex items-center flex-column">
                        <Box style={footerWidth}>
                            <footer
                                className="w-full min-h-custom pb-8 flex flex-column justify-space-between gap-4"
                                style={{ '--min-h-custom': '12rem' }}
                            >
                                <div className="mb-6"></div>
                                {footer}
                                <div className="w-full flex justify-space-between flex-column md:flex-row">
                                    <div className="flex gap-1 flex-column">
                                        <LayoutLogosV2 size={5} className="justify-center md:justify-start" />
                                        <span className="text-sm color-weak text-center mb-4 lg:mb-0">
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
            </div>
        </div>
    );
};

export default Layout;
