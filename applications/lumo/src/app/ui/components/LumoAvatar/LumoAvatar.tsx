import LottieView from 'lottie-react';

import lumoGhostAvatar from '@proton/styles/assets/img/lumo/lumo-ghost-avatar.svg';

import lumoGenerating from '../../../components/Animations/lumo-generating.json';
import lumoGhostThinking from '../../../components/Animations/lumo-ghost-avatar.json';
import lumoIdle from '../../../components/Animations/lumo-idle.json';
import lumoWebSearch from '../../../components/Animations/lumo-websearch.json';
import { useGhostChat } from '../../../providers/GhostChatProvider';

import './LumoAvatar.scss';

interface LumoAvatarProps {
    isGenerating?: boolean;
    isGeneratingWithToolCall?: boolean;
}

const LumoAvatar = ({ isGenerating, isGeneratingWithToolCall }: LumoAvatarProps) => {
    const { isGhostChatMode } = useGhostChat();
    return (
        <div className="self-start shrink-0 relative no-print">
            {!isGhostChatMode ? (
                <LottieView
                    alt=""
                    animationData={
                        isGenerating ? (isGeneratingWithToolCall ? lumoWebSearch : lumoGenerating) : lumoIdle
                    }
                    loop={true}
                    className="lumo-avatar"
                />
            ) : isGenerating ? (
                <LottieView
                    alt="Lumo ghost avatar"
                    animationData={lumoGhostThinking}
                    loop={true}
                    className="lumo-avatar"
                />
            ) : (
                <img src={lumoGhostAvatar} alt="" className="mt-2" style={{ width: '56px', height: '56px' }} />
            )}
        </div>
    );
};

export default LumoAvatar;
