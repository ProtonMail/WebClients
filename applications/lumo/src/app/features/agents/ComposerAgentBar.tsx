import { c } from 'ttag';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { ProjectIcon } from '../../components/ProjectIcon/ProjectIcon';
import { useConversationAgent } from '../../hooks/useConversationAgent';
import { useLumoDispatch } from '../../redux/hooks';
import { openAgentPicker } from '../../redux/slices/composerActions';
import { DEFAULT_AGENT_ICON } from './constants';

interface ComposerAgentBarProps {
    /** Current conversation id, if a conversation already exists. */
    conversationId?: string;
}

/**
 * Shows the agent active for the current conversation as a removable badge.
 * Selecting/creating agents happens via the picker (opened from here or the Tools menu),
 * so there is no prominent entry point when no agent is active.
 */
export const ComposerAgentBar = ({ conversationId }: ComposerAgentBarProps) => {
    const dispatch = useLumoDispatch();
    const { activeAgent, clearAgent } = useConversationAgent(conversationId);

    if (!activeAgent) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 px-1 pb-1">
            <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-weak color-primary text-sm"
                data-testid="composer-agent-badge"
            >
                <ProjectIcon iconId={activeAgent.icon || DEFAULT_AGENT_ICON} size={14} />
                <button
                    type="button"
                    className="text-semibold text-ellipsis max-w-custom interactive-pseudo-inset rounded"
                    style={{ '--max-w-custom': '12rem' }}
                    onClick={() => dispatch(openAgentPicker())}
                    title={c('collider_2025:Action').t`Change agent`}
                >
                    {activeAgent.name}
                </button>
                <button
                    type="button"
                    className="flex shrink-0 interactive-pseudo-inset rounded-full"
                    onClick={clearAgent}
                    aria-label={c('collider_2025:Action').t`Remove agent`}
                    title={c('collider_2025:Action').t`Remove agent`}
                >
                    <LumoIcon name="X" width={12} height={12} />
                </button>
            </span>
            <button
                type="button"
                className="color-weak text-sm interactive-pseudo-inset rounded px-1"
                onClick={() => dispatch(openAgentPicker())}
            >
                {c('collider_2025:Action').t`Change`}
            </button>
        </div>
    );
};
