import lumoGhostAvatarDark from '@proton/styles/assets/img/lumo/lumo-ghost-avatar-dark.svg';
import lumoGhostAvatar from '@proton/styles/assets/img/lumo/lumo-ghost-avatar.svg';

import type { ToolCallName } from '../../../lib/toolCall/types';
import { useLumoTheme } from '../../../providers';
import { useGhostChat } from '../../../providers/GhostChatProvider';
import { LazyLottie } from '../../LazyLottie';

import './LumoAvatar.scss';

interface LumoAvatarProps {
    isGenerating: boolean;
    toolCallName?: ToolCallName;
}

const lightMap = {
    idle: () =>
        import(
            /* webpackChunkName: "lumo-idle-animation" */
            '../../../components/Animations/avatar/idle-light.json'
        ),
    generating: () =>
        import(
            /* webpackChunkName: "lumo-generating-animation" */
            '../../../components/Animations/avatar/thinking-light.json'
        ),
    ghostThinking: () =>
        import(
            /* webpackChunkName: "lumo-ghost-animation" */
            '../../../components/Animations/avatar/ghost-thinking-light.json'
        ),
    webSearch: () =>
        import(
            /* webpackChunkName: "lumo-websearch-animation" */
            '../../../components/Animations/avatar/web-search-light.json'
        ),
};

const darkMap = {
    idle: () =>
        import(
            /* webpackChunkName: "lumo-idle-dark-animation" */
            '../../../components/Animations/avatar/idle-dark.json'
        ),
    generating: () =>
        import(
            /* webpackChunkName: "lumo-generating-dark-animation" */
            '../../../components/Animations/avatar/thinking-dark.json'
        ),
    ghostThinking: () =>
        import(
            /* webpackChunkName: "lumo-ghost-dark-animation" */
            '../../../components/Animations/avatar/ghost-thinking-dark.json'
        ),
    webSearch: () =>
        import(
            /* webpackChunkName: "lumo-websearch-dark-animation" */
            '../../../components/Animations/avatar/web-search-dark.json'
        ),
};

type LumoAvatarAnimationKey = keyof typeof lightMap;

const useThemeLumoAvatarAnimation = (isGenerating: boolean, toolCallName?: ToolCallName) => {
    const { isGhostChatMode } = useGhostChat();
    const { isDarkLumoTheme } = useLumoTheme();

    const getAnimationSelection = (): {
        getAnimationData: (() => Promise<{ default: object }>) | null;
        animationKey: string | null;
    } => {
        // Ghost‑chat mode: static avatar when not generating
        if (isGhostChatMode && !isGenerating) {
            return { getAnimationData: null, animationKey: null };
        }

        let key: LumoAvatarAnimationKey;

        if (isGenerating) {
            if (isGhostChatMode) {
                key = 'ghostThinking';
            } else if (toolCallName === 'web_search' || toolCallName === 'proton_info') {
                key = 'webSearch';
            } else {
                key = 'generating';
            }
        } else {
            key = 'idle';
        }

        const themePrefix = isDarkLumoTheme ? 'dark' : 'light';

        return {
            getAnimationData: (isDarkLumoTheme ? darkMap[key] : lightMap[key]) ?? null,
            animationKey: `${themePrefix}-${key}`,
        };
    };

    return getAnimationSelection();
};

const LumoAvatar = ({ isGenerating, toolCallName }: LumoAvatarProps) => {
    const { isDarkLumoTheme } = useLumoTheme();
    const { getAnimationData, animationKey } = useThemeLumoAvatarAnimation(isGenerating, toolCallName);

    return (
        <div className="self-start shrink-0 relative no-print">
            {getAnimationData && animationKey ? (
                <LazyLottie
                    key={animationKey}
                    alt=""
                    getAnimationData={getAnimationData}
                    loop={true}
                    className="lumo-avatar"
                />
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
