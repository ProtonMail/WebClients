import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { GuestChatDisclaimerModal } from '../../components/Guest/GuestChatDisclaimerModal';
import { LOGO_HEIGHT, LumoLogoWithTierTag, getLogoSrc } from '../../components/LumoLogoWithTierTag/LumoLogoWithTierTag';
import { useGuestChatHandler } from '../../hooks/useGuestChatHandler';
import { useLumoPlan } from '../../providers/LumoPlanProvider';
import { useLumoTheme } from '../../providers/LumoThemeProvider';

import './LumoLogo.scss';

const LumoLogoHeader = memo(() => {
    const { isGuest, handleGuestClick, handleDisclaimerClose, disclaimerModalProps } = useGuestChatHandler();
    const { theme } = useLumoTheme();
    const { isLumoPlanLoading } = useLumoPlan();

    const logoSrc = useMemo(() => {
        return getLogoSrc(theme);
    }, [theme]);

    const onGuestClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        handleGuestClick();
    };

    // Show default logo during loading instead of blank space
    if (isLumoPlanLoading) {
        return (
            <Link to="/" aria-label={`Go to ${LUMO_SHORT_APP_NAME} homepage`} className="lumo-logo-container">
                <img src={logoSrc} alt={LUMO_SHORT_APP_NAME} height={LOGO_HEIGHT} />
            </Link>
        );
    }

    const logoContent = <LumoLogoWithTierTag />;

    if (isGuest) {
        return (
            <>
                <Link to="/" onClick={onGuestClick} aria-label={`Go to ${LUMO_SHORT_APP_NAME} homepage`}>
                    {logoContent}
                </Link>
                {disclaimerModalProps.render && (
                    <GuestChatDisclaimerModal onClick={handleDisclaimerClose} {...disclaimerModalProps.modalProps} />
                )}
            </>
        );
    }

    return (
        <Link to="/" aria-label={`Go to ${LUMO_SHORT_APP_NAME} homepage`}>
            {logoContent}
        </Link>
    );
});

LumoLogoHeader.displayName = 'LumoLogoHeader';
export default LumoLogoHeader;
