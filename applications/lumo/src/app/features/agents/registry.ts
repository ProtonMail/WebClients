import type { CustomAgent } from '../../redux/slices/lumoUserSettings';
import { AGENT_BYLINE_MAX_LENGTH } from './constants';
import { getDefaultAgents } from './defaultAgents';

/**
 * Resolve an agent by id across both the built-in (Proton-published) catalog and the
 * user's personal agents. Personal agents win on id collision.
 *
 * This is a plain function (no React/Redux) so it can be used both in the UI and in the
 * LLM send path (`resolveAgentInstructions`).
 */
export function findAgentById(id: string | undefined, personalAgents: CustomAgent[] = []): CustomAgent | undefined {
    if (!id) {
        return undefined;
    }
    return personalAgents.find((a) => a.id === id) ?? getDefaultAgents().find((a) => a.id === id);
}

export function isAgentEditable(agent: CustomAgent | undefined): boolean {
    return agent?.source === 'personal';
}

/**
 * A short one-line byline for an agent, used in the picker so every row stays balanced.
 * Falls back to a snippet of the instructions when no explicit description is set.
 */

export function truncateString(str: string, maxLength: number): string {
    return str.length > maxLength ? `${str.slice(0, maxLength - 1).trimEnd()}…` : str;
}

export function getAgentByline(agent: CustomAgent, maxLength = AGENT_BYLINE_MAX_LENGTH): string {
    const explicit = agent.description?.trim();
    if (explicit) {
        return truncateString(explicit, maxLength);
    }
    const firstLine = agent.instructions
        ?.split('\n')
        .map((line) => line.trim())
        .find((line) => line.length > 0);
    if (!firstLine) {
        return '';
    }
    return truncateString(firstLine, maxLength);
}

/**
 * Build a shareable absolute deep link that opens Lumo in a new chat with the given
 * agent pre-activated (read by `?skill=` in ConversationPageComponent). Derives the app
 * basename (`/u/<sessionId>` or `/guest`) from the current location.
 */
export function buildAgentDeepLink(agentId: string): string {
    const match = window.location.pathname.match(/^\/(u\/\d+|guest)/);
    const basename = match ? `/${match[1]}` : '';
    return `${window.location.origin}${basename}/?skill=${encodeURIComponent(agentId)}`;
}

/**
 * Build a shareable absolute link to the minimal chatbot surface (`/agent?skill=<id>`).
 * This is the best link to hand to someone else: it runs in guest mode (no sign-in) and
 * loads almost instantly into a simple, single-agent chat.
 */
export function buildAgentChatLink(agentId: string): string {
    return `${window.location.origin}/?skill=${encodeURIComponent(agentId)}`;
}
