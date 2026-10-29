import { isSkillPlugin } from '../skills/skillBundle';
import type { Skill, SkillSource, SubSkill } from '../skills/types';

export type SkillGroup =
    | { kind: 'plugin'; key: string; skill: Skill; subSkills: SubSkill[] }
    | { kind: 'source'; key: string; source: SkillSource; skills: Skill[] };

const SOURCE_ORDER: SkillSource[] = ['created', 'uploaded', 'custom-lumo', 'proton'];

const matches = (query: string, ...values: (string | undefined)[]) =>
    values.some((value) => value?.toLowerCase().includes(query));

/**
 * Groups skills by tag: each plugin is its own group listing its skills, and standalone skills are
 * grouped by where they came from. Your own skills come first, then plugins, then migrated and
 * Proton skills. A search keeps a whole plugin when its name matches, otherwise only matching skills.
 */
export const groupSkills = (skills: Skill[], searchQuery = ''): SkillGroup[] => {
    const query = searchQuery.trim().toLowerCase();
    const plugins: SkillGroup[] = [];
    const bySource = new Map<SkillSource, Skill[]>();

    for (const skill of skills) {
        if (isSkillPlugin(skill)) {
            const subSkills = skill.subSkills ?? [];
            const visible =
                !query || matches(query, skill.name, skill.description)
                    ? subSkills
                    : subSkills.filter((subSkill) => matches(query, subSkill.name, subSkill.description));
            if (visible.length > 0 || (subSkills.length === 0 && (!query || matches(query, skill.name)))) {
                plugins.push({ kind: 'plugin', key: skill.id, skill, subSkills: visible });
            }
        } else if (!query || matches(query, skill.name, skill.description)) {
            bySource.set(skill.source, [...(bySource.get(skill.source) ?? []), skill]);
        }
    }

    plugins.sort((a, b) => (a.kind === 'plugin' && b.kind === 'plugin' ? a.skill.name.localeCompare(b.skill.name) : 0));

    const sourceGroup = (source: SkillSource): SkillGroup[] => {
        const group = bySource.get(source);
        return group ? [{ kind: 'source', key: source, source, skills: group }] : [];
    };

    return [
        ...SOURCE_ORDER.slice(0, 2).flatMap(sourceGroup),
        ...plugins,
        ...SOURCE_ORDER.slice(2).flatMap(sourceGroup),
    ];
};
