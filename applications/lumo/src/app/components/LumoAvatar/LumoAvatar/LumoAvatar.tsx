import lumoGhostAvatarDark from '@proton/styles/assets/img/lumo/lumo-ghost-avatar-dark.svg';
import lumoGhostAvatar from '@proton/styles/assets/img/lumo/lumo-ghost-avatar.svg';

import { LazyLottie } from '../../LazyLottie';
import type { ToolCallName } from '../../../lib/toolCall/types';
import { useGhostChat } from '../../../providers/GhostChatProvider';
import { useLumoTheme } from '../../../providers';

import './LumoAvatar.scss';

interface LumoAvatarProps {
    isGenerating: boolean;
    toolCallName?: ToolCallName;
}

const lightMap = {
    idle: () =>
        import(
            /* webpackChunkName: "lumo-idle-animation" */
            '../../../components/Animations/lumo-idle.json'
        ),
    generating: () =>
        import(
            /* webpackChunkName: "lumo-generating-animation" */
            '../../../components/Animations/lumo-generating.json'
        ),
    ghostThinking: () =>
        import(
            /* webpackChunkName: "lumo-ghost-animation" */
            '../../../components/Animations/lumo-ghost-avatar.json'
        ),
    webSearch: () =>
        import(
            /* webpackChunkName: "lumo-websearch-animation" */
            '../../../components/Animations/lumo-websearch.json'
        ),
};

const darkMap = {
    idle: () =>
        import(
            /* webpackChunkName: "lumo-idle-dark-animation" */
            '../../../components/Animations/lumo-idle-dark.json'
        ),
    generating: () =>
        import(
            /* webpackChunkName: "lumo-idle-dark-animation" */
            '../../../components/Animations/lumo-thinking-dark.json'
        ),
    ghostThinking: () =>
        import(
            /* webpackChunkName: "lumo-ghost-dark-animation" */
            '../../../components/Animations/lumo-ghost-thinking-dark.json'
        ),
    webSearch: () =>
        import(
            /* webpackChunkName: "lumo-websearch-dark-animation" */
            '../../../components/Animations/lumo-websearch-dark.json'
        ),
};

const useThemeLumoAvatarAnimation = (isGenerating: boolean, toolCallName?: ToolCallName) => {
    const { isGhostChatMode } = useGhostChat();
    const { isDarkLumoTheme } = useLumoTheme();

    const getAnimationDataToImport = () => {
        // Ghost‑chat mode: static avatar when not generating
        if (isGhostChatMode && !isGenerating) {
            return null;
        }

        let key: keyof typeof lightMap;

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

        return (isDarkLumoTheme ? darkMap[key] : lightMap[key]) ?? null;
    };

    /* getAnimationData returns a stable function */
    return { getAnimationData: getAnimationDataToImport(), isDarkLumoTheme };
};

const LumoAvatar = ({ isGenerating, toolCallName }: LumoAvatarProps) => {
    const { getAnimationData, isDarkLumoTheme } = useThemeLumoAvatarAnimation(isGenerating, toolCallName);

    return (
        <div className="self-start shrink-0 relative no-print">
            {getAnimationData ? (
                <LazyLottie alt="" getAnimationData={getAnimationData} loop={true} className="lumo-avatar" />
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
