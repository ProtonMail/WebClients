export { PROJECT_ICONS as AGENT_ICONS, getIconFromProjectName as getIconFromAgentName } from '../projects/constants';

export const DEFAULT_AGENT_ICON = 'robot';

export const AGENT_INSTRUCTIONS_MAX_LENGTH = 8000;

/** Max length of the one-line description shown in the agent picker. */
export const AGENT_BYLINE_MAX_LENGTH = 90;

/** Max number of conversation starters shown on an agent's welcome screen. */
export const MAX_CONVERSATION_STARTERS = 4;

/** Max length of a single conversation starter. */
export const CONVERSATION_STARTER_MAX_LENGTH = 120;

/** Trim, drop empties and enforce the count/length limits on a list of conversation starters. */
export const sanitizeConversationStarters = (starters?: string[]): string[] | undefined => {
    const cleaned = (starters ?? [])
        .map((starter) => starter.trim().slice(0, CONVERSATION_STARTER_MAX_LENGTH))
        .filter(Boolean)
        .slice(0, MAX_CONVERSATION_STARTERS);
    return cleaned.length ? cleaned : undefined;
};
