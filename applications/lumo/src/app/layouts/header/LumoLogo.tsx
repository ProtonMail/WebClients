import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoBusinessLogoDark from '@proton/styles/assets/img/lumo/lumo-business-logo-dark.svg';
import lumoBusinessLogo from '@proton/styles/assets/img/lumo/lumo-business-logo.svg';
import lumoLogoDark from '@proton/styles/assets/img/lumo/lumo-logo-v4-dark.svg';
import lumoLogo from '@proton/styles/assets/img/lumo/lumo-logo-v4.svg';

import { useGuestChatHandler } from '../../hooks/useGuestChatHandler';
import { useLumoPlan } from '../../providers/LumoPlanProvider';
import { ThemeTypes, useLumoTheme } from '../../providers/LumoThemeProvider';
import { GuestChatDisclaimerModal } from '../../components/Modals/GuestChatDisclaimerModal';
import LumoPlusLogoInline from '../../components/Icons/LumoPlusLogoInline';

const LOGO_HEIGHT = '21px';

const getLogoSrc = (theme: ThemeTypes, hasLumoB2B: boolean, hasLumoSeat: boolean) => {
    if (hasLumoB2B) {
        return theme === ThemeTypes.LumoDark ? lumoBusinessLogoDark : lumoBusinessLogo;
    }
    if (hasLumoSeat) {
        return undefined; // Use LumoPlusLogoInline component
    }
    return theme === ThemeTypes.LumoDark ? lumoLogoDark : lumoLogo;
};

const LumoLogoHeader = memo(() => {
    const { isGuest, handleGuestClick, handleDisclaimerClose, disclaimerModalProps } = useGuestChatHandler();
    const { theme } = useLumoTheme();
    const { hasLumoSeat, hasLumoB2B, isLumoPlanLoading } = useLumoPlan();

    const logoSrc = useMemo(() => getLogoSrc(theme, hasLumoB2B, hasLumoSeat), [theme, hasLumoB2B, hasLumoSeat]);

    const onGuestClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        handleGuestClick();
    };

    // Show default logo during loading instead of blank space
    if (isLumoPlanLoading) {
        const defaultLogoSrc = theme === ThemeTypes.LumoDark ? lumoLogoDark : lumoLogo;
        return (
            <Link to="/" aria-label={`Go to ${LUMO_SHORT_APP_NAME} homepage`}>
                <img src={defaultLogoSrc} alt={LUMO_SHORT_APP_NAME} />
            </Link>
        );
    }

    const getAltText = () => {
        if (hasLumoB2B) return `${LUMO_SHORT_APP_NAME} Business`;
        if (hasLumoSeat) return `${LUMO_SHORT_APP_NAME} Plus`;
        return LUMO_SHORT_APP_NAME;
    };

    if (isGuest) {
        return (
            <>
                <Link to="/" onClick={onGuestClick} aria-label={`Go to ${LUMO_SHORT_APP_NAME} homepage`}>
                    <img src={logoSrc} alt={getAltText()} />
                </Link>
                {disclaimerModalProps.render && (
                    <GuestChatDisclaimerModal onClick={handleDisclaimerClose} {...disclaimerModalProps.modalProps} />
                )}
            </>
        );
    }

    return (
        <Link to="/" aria-label={`Go to ${LUMO_SHORT_APP_NAME} homepage`}>
            {logoSrc ? <img src={logoSrc} alt={getAltText()} /> : <LumoPlusLogoInline height={LOGO_HEIGHT} />}
        </Link>
    );
});

LumoLogoHeader.displayName = 'LumoLogoHeader';
export default LumoLogoHeader;
