import { useState } from 'react';

import { clsx } from 'clsx';
import LottieView from 'lottie-react';

import lumoGhost from '@proton/styles/assets/img/lumo/lumo-sit-side-ghost.svg';

import lumoCatDark from '../../../components/Animations/lumo-cat-dark.json';
import lumoCatLight from '../../../components/Animations/lumo-cat.json';
import lumoHalloweenFloatingDark from '../../../components/Animations/lumo-halloween-floating-dark.json';
import lumoHalloweenFloating from '../../../components/Animations/lumo-halloween-floating.json';
import lumoHalloweenFlyingDark from '../../../components/Animations/lumo-halloween-flying-dark.json';
import lumoHalloweenFlying from '../../../components/Animations/lumo-halloween-flying.json';
import { useLumoTheme } from '../../../providers/LumoThemeProvider';

interface LumoCatProps {
    isSmallScreen: boolean;
    isGhostChatMode: boolean;
    isLumoHalloweenEnabled: boolean;
}

const LumoCat = ({ isSmallScreen, isGhostChatMode, isLumoHalloweenEnabled }: LumoCatProps) => {
    const { isDarkLumoTheme } = useLumoTheme();
    const [isFlyingMode, setIsFlyingMode] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleInteraction = () => {
        if (!isLumoHalloweenEnabled) return;

        setIsTransitioning(true);

        setTimeout(() => {
            setIsFlyingMode(!isFlyingMode);
            setIsTransitioning(false);
        }, 150);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleInteraction();
        }
    };

    // Choose animation based on current mode and theme
    const getAnimationData = () => {
        if (isLumoHalloweenEnabled) {
            if (isFlyingMode) {
                return isDarkLumoTheme ? lumoHalloweenFlyingDark : lumoHalloweenFlying;
            }
            return isDarkLumoTheme ? lumoHalloweenFloatingDark : lumoHalloweenFloating;
        }
        return isDarkLumoTheme ? lumoCatDark : lumoCatLight;
    };

    return (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <div
            className={clsx('shrink-0 mt-auto text-center relative', {
                'mx-auto': isSmallScreen,
                'cursor-pointer': isLumoHalloweenEnabled,
            })}
            style={{ width: isSmallScreen ? 200 : 170, height: isSmallScreen ? 200 : 170 }}
            onClick={isLumoHalloweenEnabled ? handleInteraction : undefined}
            onKeyDown={isLumoHalloweenEnabled ? handleKeyDown : undefined}
            tabIndex={isLumoHalloweenEnabled ? 0 : -1}
            role={isLumoHalloweenEnabled ? 'button' : undefined}
            aria-label={isLumoHalloweenEnabled ? 'Toggle Lumo appearance' : undefined}
        >
            <img
                src={lumoGhost}
                alt="Lumo ghost avatar"
                className="absolute inset-0"
                style={{
                    width: isSmallScreen ? 160 : 140,
                    height: 'auto',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    opacity: isGhostChatMode ? 1 : 0,
                    transition: 'opacity 300ms ease-out',
                    pointerEvents: isGhostChatMode ? 'auto' : 'none',
                    margin: isSmallScreen ? '0 auto' : '',
                }}
            />

            <LottieView
                alt="Lumo assistant avatar"
                animationData={getAnimationData()}
                loop={true}
                className="absolute inset-0"
                style={{
                    width: isSmallScreen ? 200 : 170,
                    height: isSmallScreen ? 200 : 170,
                    opacity: isGhostChatMode || isTransitioning ? 0 : 1,
                    transition: 'opacity 300ms ease-out',
                    pointerEvents: !isGhostChatMode ? 'auto' : 'none',
                    margin: isSmallScreen ? '0 auto' : '',
                }}
            />
        </div>
    );
};

export default LumoCat;
