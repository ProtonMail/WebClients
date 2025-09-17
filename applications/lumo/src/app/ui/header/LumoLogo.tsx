import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoLogoDark from '@proton/styles/assets/img/lumo/lumo-logo-V3-dark.svg';
import lumoLogo from '@proton/styles/assets/img/lumo/lumo-logo-V3.svg';

import { useGuestChatHandler } from '../../hooks/useGuestChatHandler';
import { useLumoPlan } from '../../providers/LumoPlanProvider';
import { ThemeTypes, useLumoTheme } from '../../providers/LumoThemeProvider';
import { GuestChatDisclaimerModal } from '../components/GuestChatDisclaimerModal';
import LumoPlusLogoInline from '../components/LumoPlusLogoInline';

const LumoLogoHeader = memo(() => {
    const { isGuest, handleGuestClick, handleDisclaimerClose, disclaimerModalProps } = useGuestChatHandler();
    const { theme } = useLumoTheme();
    const { hasLumoSeat } = useLumoPlan();

    const onGuestClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        handleGuestClick();
    };

    const logoSrc = useMemo(() => {
        return theme === ThemeTypes.LumoDark ? lumoLogoDark : lumoLogo;
    }, [theme]);

    if (isGuest) {
        return (
            <>
                <Link to="/" onClick={onGuestClick}>
                    <img src={logoSrc} alt={LUMO_SHORT_APP_NAME} />
                </Link>
                {disclaimerModalProps.render && (
                    <GuestChatDisclaimerModal onClick={handleDisclaimerClose} {...disclaimerModalProps.modalProps} />
                )}
            </>
        );
    }

    return (
        <Link to="/">
            {hasLumoSeat ? <LumoPlusLogoInline height="21px" /> : <img src={logoSrc} alt={LUMO_SHORT_APP_NAME} />}
        </Link>
    );
});

export default LumoLogoHeader;
