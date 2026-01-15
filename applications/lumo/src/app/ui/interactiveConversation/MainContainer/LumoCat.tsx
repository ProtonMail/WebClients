import { clsx } from 'clsx';

import lumoGhost from '@proton/styles/assets/img/lumo/lumo-sit-side-ghost.svg';

import { LazyLottie } from '../../../components/LazyLottie';
import { useLumoTheme } from '../../../providers/LumoThemeProvider';

const getLumoCatDark = () =>
    import(
        /* webpackChunkName: "lumo-cat-dark-animation" */
        '../../../components/Animations/lumo-cat-dark.json'
    );
const getLumoCatLight = () =>
    import(
        /* webpackChunkName: "lumo-cat-light-animation" */
        '../../../components/Animations/lumo-cat.json'
    );

interface LumoCatProps {
    isSmallScreen: boolean;
    isGhostChatMode: boolean;
    isLumoSpecialThemeEnabled: boolean;
}

const LumoCat = ({ isSmallScreen, isGhostChatMode, isLumoSpecialThemeEnabled }: LumoCatProps) => {
    const { isDarkLumoTheme } = useLumoTheme();

    const getAnimationData = (() => {
        if (isLumoSpecialThemeEnabled) {
            // update with themed animations
            return isDarkLumoTheme ? getLumoCatDark : getLumoCatLight;
        }

        // Special theme disabled, show normal variants
        return isDarkLumoTheme ? getLumoCatDark : getLumoCatLight;
    })();

    return (
        <div
            className={clsx('lumo-cat-container shrink-0 mt-auto text-center relative', {
                'mx-auto': isSmallScreen,
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

            <LazyLottie
                alt="Lumo assistant avatar"
                getAnimationData={getAnimationData}
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
