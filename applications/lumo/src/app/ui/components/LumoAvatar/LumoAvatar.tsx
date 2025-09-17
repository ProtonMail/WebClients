import { useMemo } from 'react';

import LottieView from 'lottie-react';

import lumoGhostAvatarDark from '@proton/styles/assets/img/lumo/lumo-ghost-avatar-dark.svg';
import lumoGhostAvatar from '@proton/styles/assets/img/lumo/lumo-ghost-avatar.svg';

import lumoGenerating from '../../../components/Animations/lumo-generating.json';
import lumoGhostThinking from '../../../components/Animations/lumo-ghost-avatar.json';
import lumoGhostThinkingDark from '../../../components/Animations/lumo-ghost-thinking-dark.json';
import lumoIdleDark from '../../../components/Animations/lumo-idle-dark.json';
import lumoIdle from '../../../components/Animations/lumo-idle.json';
import lumoGeneratingDark from '../../../components/Animations/lumo-thinking-dark.json';
import lumoWebSearchDark from '../../../components/Animations/lumo-websearch-dark.json';
import lumoWebSearch from '../../../components/Animations/lumo-websearch.json';
import { useGhostChat } from '../../../providers/GhostChatProvider';
import { useLumoTheme } from '../../../providers/LumoThemeProvider';

import './LumoAvatar.scss';

interface LumoAvatarProps {
    isGenerating: boolean;
    isGeneratingWithToolCall: boolean;
}

const useThemeLumoAvatarAnimation = (isGenerating: boolean, isGeneratingWithToolCall: boolean) => {
    const { isGhostChatMode } = useGhostChat();
    const { isDarkLumoTheme } = useLumoTheme();

    const lightMap = {
        idle: lumoIdle,
        generating: lumoGenerating,
        ghostThinking: lumoGhostThinking,
        webSearch: lumoWebSearch,
    };

    const darkMap = {
        idle: lumoIdleDark,
        generating: lumoGeneratingDark,
        ghostThinking: lumoGhostThinkingDark,
        webSearch: lumoWebSearchDark,
    };

    const animationData = useMemo(() => {
        // Ghost‑chat mode: static avatar when not generating
        if (isGhostChatMode && !isGenerating) return null;

        let key: keyof typeof lightMap;

        if (isGenerating) {
            if (isGhostChatMode) {
                key = 'ghostThinking';
            } else if (isGeneratingWithToolCall) {
                key = 'webSearch';
            } else {
                key = 'generating';
            }
        } else {
            key = 'idle';
        }

        return (isDarkLumoTheme ? darkMap[key] : lightMap[key]) ?? null;
    }, [isGhostChatMode, isGenerating, isGeneratingWithToolCall, isDarkLumoTheme]);

    return { animationData, isDarkLumoTheme };
};

const LumoAvatar = ({ isGenerating, isGeneratingWithToolCall }: LumoAvatarProps) => {
    const { animationData, isDarkLumoTheme } = useThemeLumoAvatarAnimation(isGenerating, isGeneratingWithToolCall);

    return (
        <div className="self-start shrink-0 relative no-print">
            {animationData ? (
                <LottieView alt="" animationData={animationData} loop={true} className="lumo-avatar" />
            ) : (
                <img
                    src={isDarkLumoTheme ? lumoGhostAvatarDark : lumoGhostAvatar}
                    alt=""
                    className="mt-2"
                    style={{ width: '56px', height: '56px' }}
                />
            )}
        </div>
    );
};

export default LumoAvatar;
