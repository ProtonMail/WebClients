import { getSubSkillMarkdownPath } from '../skills/skillBundle';
import type { SkillId, SubSkill } from '../skills/types';

/** Query parameter of the skill page that opens a file in the Contents tab. */
export const SKILL_FILE_PARAM = 'file';

export const getSkillPath = (id: SkillId) => `/customize/skills/${id}`;

/** Opens a plugin's page on the SKILL.md of one of its skills. */
export const getSubSkillPath = (id: SkillId, subSkill: Pick<SubSkill, 'path'>) =>
    `${getSkillPath(id)}?${new URLSearchParams({ [SKILL_FILE_PARAM]: getSubSkillMarkdownPath(subSkill) })}`;
