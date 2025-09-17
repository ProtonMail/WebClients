import { clsx } from 'clsx';
import LottieView from 'lottie-react';

import lumoGhost from '@proton/styles/assets/img/lumo/lumo-sit-side-ghost.svg';

import lumoCatDark from '../../../components/Animations/lumo-cat-dark.json';
import lumoCatLight from '../../../components/Animations/lumo-cat.json';
import { useLumoTheme } from '../../../providers/LumoThemeProvider';

interface LumoCatProps {
    isSmallScreen: boolean;
    isGhostChatMode: boolean;
}

const LumoCat = ({ isSmallScreen, isGhostChatMode }: LumoCatProps) => {
    const { isDarkLumoTheme } = useLumoTheme();
    return (
        <div
            className={clsx('shrink-0 mt-auto text-center relative', isSmallScreen && 'mx-auto')}
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
                animationData={isDarkLumoTheme ? lumoCatDark : lumoCatLight}
                loop={true}
                className="absolute inset-0"
                style={{
                    width: isSmallScreen ? 200 : 170,
                    height: isSmallScreen ? 200 : 170,
                    opacity: !isGhostChatMode ? 1 : 0,
                    transition: 'opacity 300ms ease-out',
                    pointerEvents: !isGhostChatMode ? 'auto' : 'none',
                    margin: isSmallScreen ? '0 auto' : '',
                }}
            />
        </div>
    );
};

export default LumoCat;
