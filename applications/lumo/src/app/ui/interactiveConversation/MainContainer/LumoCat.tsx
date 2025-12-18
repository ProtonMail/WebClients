import { clsx } from 'clsx';
import LottieView from 'lottie-react';

import lumoGhost from '@proton/styles/assets/img/lumo/lumo-sit-side-ghost.svg';

import lumoCatDark from '../../../components/Animations/lumo-cat-dark.json';
import lumoCatLight from '../../../components/Animations/lumo-cat.json';
import lumoNewYearsDark from '../../../components/Animations/lumo-new-years-dark.json';
import lumoNewYearsLight from '../../../components/Animations/lumo-new-years-light.json';
import lumoXmasDark from '../../../components/Animations/lumo-xmas-dark.json';
import lumoXmasLight from '../../../components/Animations/lumo-xmas-light.json';
import { useLumoTheme } from '../../../providers/LumoThemeProvider';
import { isNewYearsSeason } from '../../../utils/dateUtils';

interface LumoCatProps {
    isSmallScreen: boolean;
    isGhostChatMode: boolean;
    isLumoSpecialThemeEnabled: boolean;
}

const LumoCat = ({ isSmallScreen, isGhostChatMode, isLumoSpecialThemeEnabled }: LumoCatProps) => {
    const { isDarkLumoTheme } = useLumoTheme();
    const showNewYearsVariant = isNewYearsSeason();

    const getAnimationData = () => {
        if (isLumoSpecialThemeEnabled) {
            // After December 29th, 2025 for New Year's variants
            if (showNewYearsVariant) {
                return isDarkLumoTheme ? lumoNewYearsDark : lumoNewYearsLight;
            }
            // Before December 29th, show Christmas variants
            return isDarkLumoTheme ? lumoXmasDark : lumoXmasLight;
        }

        // Special theme disabled, show normal variants
        return isDarkLumoTheme ? lumoCatDark : lumoCatLight;
    };

    return (
        <div
            className={clsx('lumo-cat-container shrink-0 mt-auto text-center relative', {
                'mx-auto': isSmallScreen,
                'new-years-variant': showNewYearsVariant && !isGhostChatMode,
                'christmas-variant': isLumoSpecialThemeEnabled && !showNewYearsVariant && !isGhostChatMode,
            })}
            style={{ width: isSmallScreen ? 200 : 170, height: isSmallScreen ? 200 : 170 }}
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
                    opacity: isGhostChatMode ? 0 : 1,
                    transition: 'opacity 300ms ease-out',
                    pointerEvents: !isGhostChatMode ? 'auto' : 'none',
                    margin: isSmallScreen ? '0 auto' : '',
                }}
            />
        </div>
    );
};

export default LumoCat;
