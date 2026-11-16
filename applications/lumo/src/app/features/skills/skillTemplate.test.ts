import { findSubSkills, parseConnectorsMarkdown } from './skillBundle';
import { checkSkill } from './skillCheck';
import { encodeText } from './skillFiles';
import { parseSkillMarkdown } from './skillMarkdown';
import {
    getConnectorsMarkdownTemplate,
    getSkillInstructionsTemplate,
    getSkillSetReadmeTemplate,
    getSubSkillMarkdownTemplate,
} from './skillTemplate';

describe('getSkillInstructionsTemplate', () => {
    it('is laid out like the bundled skills', () => {
        const lines = getSkillInstructionsTemplate().split('\n');

        expect(lines.filter((line) => line.startsWith('#'))).toEqual(['# Skill name', '## Steps', '## Rules']);
        expect(lines.filter((line) => /^\d\. \*\*[^*]+\*\* \S/.test(line))).toHaveLength(3);
        expect(lines.filter((line) => line.startsWith('- '))).toHaveLength(1);
    });

    it('is a valid SKILL.md body that the skill check does not flag', () => {
        const template = getSkillInstructionsTemplate();

        expect(parseSkillMarkdown(template)).toEqual({ frontmatter: {}, body: template.trim() });
        expect(checkSkill({ instructions: template, files: [] }).findings).toEqual([]);
    });
});

describe('getSubSkillMarkdownTemplate', () => {
    it('gives an added skill frontmatter that the bundle reads', () => {
        const markdown = getSubSkillMarkdownTemplate('report');
        const files = [{ path: 'skills/report/SKILL.md', mimeType: 'text/markdown', data: encodeText(markdown) }];

        expect(markdown.startsWith('---\nname: report\ndescription: ')).toBe(true);
        expect(findSubSkills(files)).toEqual([
            expect.objectContaining({ path: 'skills/report', name: 'report', enabled: true }),
        ]);
    });
});

describe('getConnectorsMarkdownTemplate', () => {
    it('parses into connector categories', () => {
        expect(parseConnectorsMarkdown(getConnectorsMarkdownTemplate())).toEqual([
            { name: 'Email', placeholder: '~~email', included: ['Proton Mail'], alternatives: [] },
        ]);
    });
});

describe('getSkillSetReadmeTemplate', () => {
    it('starts from the skill set name and description', () => {
        expect(getSkillSetReadmeTemplate('Reports', 'Weekly reports.')).toBe('# Reports\n\nWeekly reports.\n');
    });
});
