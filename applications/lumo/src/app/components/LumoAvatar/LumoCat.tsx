import { clsx } from 'clsx';

import lumoGhost from '@proton/styles/assets/img/lumo/lumo-sit-side-ghost.svg';

import { getActiveSpecialTheme } from '../../features/themes';
import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useLumoTheme } from '../../providers';
import { LazyLottie } from '../LazyLottie';

import './LumoCat.scss';

// Default Lumo cat animations (shown when no special theme is active)
const getLumoCatDark = () =>
    import(
        /* webpackChunkName: "lumo-cat-default-dark-animation" */
        '../../features/themes/assets/default/dark.json'
    );
const getLumoCatLight = () =>
    import(
        /* webpackChunkName: "lumo-cat-default-light-animation" */
        '../../features/themes/assets/default/light.json'
    );

interface LumoCatProps {
    isSmallScreen: boolean;
    isGhostChatMode: boolean;
}

const LumoCat = ({ isSmallScreen, isGhostChatMode }: LumoCatProps) => {
    const { isDarkLumoTheme } = useLumoTheme();
    const { specialTheme: isLumoSpecialThemeEnabled } = useLumoFlags();

    const getAnimationData = (() => {
        // Check if there's an active special theme
        if (isLumoSpecialThemeEnabled) {
            const activeTheme = getActiveSpecialTheme();
            if (activeTheme) {
                return isDarkLumoTheme ? activeTheme.getAnimationDark : activeTheme.getAnimationLight;
            }
        }

        // Fall back to default cat animations
        return isDarkLumoTheme ? getLumoCatDark : getLumoCatLight;
    })();

    return (
        <div
            className={clsx('lumo-cat-container shrink-0 mt-auto text-center relative', {
                'mx-auto': isSmallScreen,
                'special-theme-variant': isLumoSpecialThemeEnabled,
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
                className={clsx('absolute inset-0', {
                    'chinese-new-year': isLumoSpecialThemeEnabled,
                })}
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
