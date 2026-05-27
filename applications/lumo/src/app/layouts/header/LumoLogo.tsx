import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { clsx } from 'clsx';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoLogov6Dark from '@proton/styles/assets/img/lumo/lumo-logo-v6-dark.svg';
import lumoLogov6 from '@proton/styles/assets/img/lumo/lumo-logo-v6.svg';

import { GuestChatDisclaimerModal } from '../../components/Guest/GuestChatDisclaimerModal';
import { useGuestChatHandler } from '../../hooks/useGuestChatHandler';
import { useLumoPlan } from '../../providers/LumoPlanProvider';
import { ThemeTypes, useLumoTheme } from '../../providers/LumoThemeProvider';

import './LumoLogo.scss';

const LOGO_HEIGHT = '18px';

const getLogoSrc = (theme: ThemeTypes) => {
    return theme === ThemeTypes.LumoDark ? lumoLogov6Dark : lumoLogov6;
};

const getTierTag = (hasLumoB2B: boolean, hasLumoSeat: boolean) => {
    if (hasLumoB2B) return 'pro';
    if (hasLumoSeat) return 'plus';
    return null;
};

const LumoLogoHeader = memo(() => {
    const { isGuest, handleGuestClick, handleDisclaimerClose, disclaimerModalProps } = useGuestChatHandler();
    const { theme } = useLumoTheme();
    const { hasLumoSeat, hasLumoB2B, isLumoPlanLoading } = useLumoPlan();

    const logoSrc = useMemo(() => getLogoSrc(theme), [theme]);
    const tierTag = useMemo(() => getTierTag(hasLumoB2B, hasLumoSeat), [hasLumoB2B, hasLumoSeat]);

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

    const getAltText = () => {
        if (hasLumoB2B) return `${LUMO_SHORT_APP_NAME} Business`;
        if (hasLumoSeat) return `${LUMO_SHORT_APP_NAME} Plus`;
        return LUMO_SHORT_APP_NAME;
    };

    const logoContent = (
        <div className="flex flex-row flex-nowrap items-center gap-2">
            <img src={logoSrc} alt={getAltText()} height={LOGO_HEIGHT} />
            {tierTag && (
                <span
                    className={clsx(
                        'tier-tag text-xs text-norm color-invert rounded-sm px-1 py-0.5 block',
                        tierTag === 'pro' ? 'pro' : 'plus'
                    )}
                >
                    {/* Do not translate these strings */}
                    {tierTag === 'pro' ? 'Pro' : 'Plus'}
                </span>
            )}
        </div>
    );

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
