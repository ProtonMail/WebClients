import { DEFAULT_AGENT_ICON } from '../../../features/agents/constants';
import { getAgentByline } from '../../../features/agents/registry';
import type { CustomAgent } from '../../../redux/slices/lumoUserSettings';
import type { CustomLumo } from '../../../remote/nativeComposerBridge';

/**
 * Display-only projection of a single agent for the native bridge. Drops
 * `instructions`/`conversationStarters` since those are only needed server-side.
 * `icon`/`description` reuse the exact fallbacks the web picker itself renders
 * (`DEFAULT_AGENT_ICON`, `getAgentByline`) so native shows the same thing web does,
 * without ever needing to see raw `instructions`.
 */
export function toCustomLumo(agent: CustomAgent): CustomLumo {
    return {
        id: agent.id,
        name: agent.name,
        icon: agent.icon || DEFAULT_AGENT_ICON,
        description: getAgentByline(agent) || undefined,
        source: agent.source,
    };
}

/**
 * Display-only projection of a list of agents for the native bridge. Excludes hidden
 * agents unless they're the currently active one, mirroring `AgentPickerModal`'s
 * filter.
 */
export function toCustomLumos(agents: CustomAgent[], activeAgentId?: string): CustomLumo[] {
    return agents.filter((agent) => !agent.hidden || agent.id === activeAgentId).map(toCustomLumo);
}
