import type { CustomAgent } from '../../redux/slices/lumoUserSettings';
import type { SkillDraft } from './types';

/**
 * Custom Lumos become skills one-to-one: the persona instructions are the SKILL.md body.
 * The agent id is kept as `legacyAgentId` so the migration runs once per agent.
 */
export const customAgentToSkillDraft = (agent: CustomAgent): SkillDraft => ({
    name: agent.name,
    description: agent.description ?? '',
    instructions: agent.instructions ?? '',
    icon: agent.icon,
    enabled: !agent.hidden,
    source: 'custom-lumo',
    conversationStarters: agent.conversationStarters,
    legacyAgentId: agent.id,
    files: [],
});

/** Agents with no skill (live or deleted) carrying their id yet. */
export const getAgentsToMigrate = (agents: CustomAgent[], migratedAgentIds: Set<string>): CustomAgent[] =>
    agents.filter((agent) => agent.source === 'personal' && !migratedAgentIds.has(agent.id));
