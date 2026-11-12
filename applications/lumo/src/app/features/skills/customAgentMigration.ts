import type { CustomAgent } from '../../redux/slices/lumoUserSettings';
import type { Skill, SkillDraft, SkillFileDraft } from './types';

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

/**
 * Extra skills migrated from the same Custom Lumo, made when several devices migrated before syncing.
 * The most recently edited copy is kept, then the oldest, so every device picks the same one.
 */
export const getDuplicateMigratedSkills = (skills: Skill[]): Skill[] => {
    const byAgent = new Map<string, Skill[]>();
    for (const skill of skills) {
        if (skill.source === 'custom-lumo' && skill.legacyAgentId) {
            byAgent.set(skill.legacyAgentId, [...(byAgent.get(skill.legacyAgentId) ?? []), skill]);
        }
    }
    return [...byAgent.values()].flatMap((copies) => {
        const [, ...duplicates] = [...copies].sort(
            (a, b) =>
                b.updatedAt.localeCompare(a.updatedAt) ||
                a.createdAt.localeCompare(b.createdAt) ||
                a.id.localeCompare(b.id)
        );
        return duplicates;
    });
};

/**
 * Migrated skills whose Custom Lumo was edited after the skill, which happens when skills are turned
 * off and the Custom Lumos picker is back. The newer edit wins.
 */
export const getSkillsToResync = (agents: CustomAgent[], skills: Skill[]): { skill: Skill; agent: CustomAgent }[] => {
    const agentsById = new Map(
        agents.filter((agent) => agent.source === 'personal').map((agent) => [agent.id, agent] as const)
    );
    return skills.flatMap((skill) => {
        const agent = skill.legacyAgentId ? agentsById.get(skill.legacyAgentId) : undefined;
        return agent && agent.updatedAt > Date.parse(skill.updatedAt) ? [{ skill, agent }] : [];
    });
};

/** Takes the Custom Lumo's persona and keeps what only the skill has: its files, metadata and on/off state. */
export const customAgentEditsToSkillDraft = (
    skill: Skill,
    agent: CustomAgent,
    files: SkillFileDraft[]
): SkillDraft => ({
    name: agent.name,
    description: agent.description ?? '',
    instructions: agent.instructions ?? '',
    icon: agent.icon,
    source: skill.source,
    metadata: skill.metadata,
    conversationStarters: agent.conversationStarters,
    files,
});
