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
                className="flex items-center gap-1 px-2 py-0.5 radius-full lumo-body-small lumo-color-glyph-brand-text lumo-bg-control-fill"
                data-testid="composer-agent-badge"
            >
                <ProjectIcon iconId={activeAgent.icon || DEFAULT_AGENT_ICON} size={14} />
                <button
                    type="button"
                    className="max-w-custom radius-8 lumo-label-medium text-ellipsis interactive-pseudo-inset"
                    style={{ '--max-w-custom': '12rem' }}
                    onClick={() => dispatch(openAgentPicker())}
                    title={c('collider_2025:Action').t`Change agent`}
                >
                    {activeAgent.name}
                </button>
                <button
                    type="button"
                    className="flex shrink-0 radius-full interactive-pseudo-inset"
                    onClick={clearAgent}
                    aria-label={c('collider_2025:Action').t`Remove agent`}
                    title={c('collider_2025:Action').t`Remove agent`}
                >
                    <LumoIcon name="X" width={12} height={12} />
                </button>
            </span>
            <button
                type="button"
                className="px-1 radius-8 lumo-body-small lumo-color-glyph-mid interactive-pseudo-inset"
                onClick={() => dispatch(openAgentPicker())}
            >
                {c('collider_2025:Action').t`Change`}
            </button>
        </div>
    );
};
