import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { Hamburger } from '@proton/components';
import { BRAND_NAME, LUMO_SHORT_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import lumoLogo from '@proton/styles/assets/img/lumo/lumo-logo-V3.svg';

import { useGuestChatHandler } from '../../hooks/useGuestChatHandler';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useSidebar } from '../../providers/SidebarProvider';
import { GuestChatDisclaimerModal } from '../components/GuestChatDisclaimerModal';

export const LumoLogo = () => {
    const { isGuest, handleGuestClick, handleDisclaimerClose, disclaimerModalProps } = useGuestChatHandler();

    const onGuestClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        handleGuestClick();
    };

    if (isGuest) {
        return (
            <>
                <Link to="/" onClick={onGuestClick}>
                    <img src={lumoLogo} alt={LUMO_SHORT_APP_NAME} />
                </Link>
                {disclaimerModalProps.render && (
                    <GuestChatDisclaimerModal onClick={handleDisclaimerClose} {...disclaimerModalProps.modalProps} />
                )}
            </>
        );
    }

    return (
        <Link to="/">
            <img src={lumoLogo} alt={LUMO_SHORT_APP_NAME} />
        </Link>
    );
};

const HeaderRightSide = ({ children }: { children: React.ReactNode }) => {
    return <div className="flex flex-nowrap items-center gap-4 no-print">{children}</div>;
};

export const LumoHeader = ({ children }: { children: ReactNode }) => {
    return (
        <header className="w-full max-w-full flex flex-nowrap items-center justify-space-between mx-auto p-3 header-lumo">
            {children}
        </header>
    );
};

interface HeaderWrapperProps {
    children: ReactNode;
}
export const HeaderWrapper = ({ children }: HeaderWrapperProps) => {
    const isGuest = useIsGuest();
    const { isVisible: isSideMenuOpen, toggle: toggleSideMenu } = useSidebar();
    const { isSmallScreen } = useSidebar();

    return (
        <>
            <header className="w-full max-w-full flex flex-nowrap items-center justify-space-between mx-auto p-3 header-lumo">
                <div className="md:flex-1 flex flex-row flex-nowrap items-center gap-2">
                    <Hamburger onToggle={toggleSideMenu} expanded={isSideMenuOpen} iconSize={5} />
                    {isSmallScreen && <LumoLogo />}
                    {!isSmallScreen && (
                        <ul className="flex-1 unstyled flex flex-row items-center m-0 mr-4 gap-2">
                            <li>
                                <LumoLogo />
                            </li>
                            <li className="pt-1 ml-5 no-print">
                                <Href href="/about" className="inline-flex py-3 px-4 color-weak text-no-decoration">{c(
                                    'collider_2025: Top nav link'
                                ).t`About`}</Href>
                            </li>
                            <li className="pt-1 no-print">
                                <Href
                                    href="https://proton.me"
                                    className="inline-flex py-3 px-4 color-weak text-no-decoration"
                                >{c('collider_2025: Top nav link').t`By ${BRAND_NAME}`}</Href>
                            </li>
                            {isGuest && (
                                <li className="ml-auto hidden lg:inline-flex no-print">
                                    <Href
                                        href="https://proton.me/mail"
                                        className="inline-flex p-3 color-weak text-no-decoration"
                                    >
                                        {c('collider_2025: Top nav link').t`Try ${MAIL_APP_NAME}`}
                                    </Href>
                                </li>
                            )}
                        </ul>
                    )}
                </div>
                <HeaderRightSide>{children}</HeaderRightSide>
            </header>
        </>
    );
};
