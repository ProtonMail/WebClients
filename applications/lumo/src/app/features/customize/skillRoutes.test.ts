import { SKILL_FILE_PARAM, getSkillPath, getSubSkillPath } from './skillRoutes';

describe('skillRoutes', () => {
    it('links a sub-skill to its SKILL.md on the plugin page', () => {
        const path = getSubSkillPath('design', { path: 'skills/accessibility-review' });
        const [pathname, search] = path.split('?');
        expect(pathname).toBe(getSkillPath('design'));
        expect(new URLSearchParams(search).get(SKILL_FILE_PARAM)).toBe('skills/accessibility-review/SKILL.md');
    });
});
