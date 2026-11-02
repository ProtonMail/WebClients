import type { SkillCommand } from './skillInvocation';
import { getSkillCommands } from './skillInvocation';
import type { Skill } from './types';

/** Sub-skills have no independent database ID; identify them by bundle ID and stable folder path. */
export const getSkillSelectionId = ({ skillId, subSkillPath }: Pick<SkillCommand, 'skillId' | 'subSkillPath'>) =>
    subSkillPath ? `${skillId}/${subSkillPath}` : skillId;

/** Match the exact skill or sub-skill reference selected for a task. */
export const isSkillCommandSelected = (command: SkillCommand, selectedIds: ReadonlySet<string>) =>
    selectedIds.has(getSkillSelectionId(command));

/** Resolve display data from the current store, including disabled skills; never persist metadata copies. */
export const resolveSkillSelection = (id: string, skills: Skill[]) => {
    const separator = id.indexOf('/');
    const skillId = separator < 0 ? id : id.slice(0, separator);
    const skill = skills.find((skill) => skill.id === skillId);
    if (!skill || separator < 0) return skill;
    return skill.subSkills?.find(({ path }) => path === id.slice(separator + 1));
};

/** Look up enabled store commands plus explicit skill or sub-skill references, without duplicates. */
export const getSkillLookupPool = (skills: Skill[], additionalRefs: string[] = []): string[] => [
    ...new Set([...getSkillCommands(skills).map(getSkillSelectionId), ...additionalRefs]),
];
