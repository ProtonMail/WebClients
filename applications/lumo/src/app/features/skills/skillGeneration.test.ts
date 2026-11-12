import { parseGeneratedSkill } from './skillGeneration';
import { SKILL_NAME_MAX_LENGTH } from './skillMarkdown';

const complete = [
    '---',
    'name: Weekly status report',
    'description: "Writes weekly updates. Use when asked for: progress summaries"',
    '---',
    '',
    '# Goal',
    'Summarize the week.',
].join('\n');

describe('parseGeneratedSkill', () => {
    it('reads a complete SKILL.md', () => {
        expect(parseGeneratedSkill(complete)).toEqual({
            name: 'Weekly status report',
            description: 'Writes weekly updates. Use when asked for: progress summaries',
            instructions: '# Goal\nSummarize the week.',
        });
    });

    it('drops a surrounding code fence', () => {
        expect(parseGeneratedSkill(`\`\`\`markdown\n${complete}\n\`\`\``)).toEqual(parseGeneratedSkill(complete));
        expect(parseGeneratedSkill(`\`\`\`markdown\n${complete}\n\`\``).instructions).toBe(
            '# Goal\nSummarize the week.'
        );
    });

    it('returns nothing while only the opening delimiter has arrived', () => {
        expect(parseGeneratedSkill('-')).toEqual({ name: '', description: '', instructions: '' });
        expect(parseGeneratedSkill('---')).toEqual({ name: '', description: '', instructions: '' });
    });

    it('reads the fields of an unclosed frontmatter without instructions', () => {
        expect(parseGeneratedSkill('---\nname: Weekly sta')).toEqual({
            name: 'Weekly sta',
            description: '',
            instructions: '',
        });
        expect(parseGeneratedSkill('---\nname: Weekly\ndescription: "Writes week')).toEqual({
            name: 'Weekly',
            description: 'Writes week',
            instructions: '',
        });
    });

    it('treats a reply without frontmatter as instructions only', () => {
        expect(parseGeneratedSkill('# Goal\nDo things')).toEqual({
            name: '',
            description: '',
            instructions: '# Goal\nDo things',
        });
    });

    it('caps the name length', () => {
        const name = 'a'.repeat(SKILL_NAME_MAX_LENGTH + 10);
        expect(parseGeneratedSkill(`---\nname: ${name}\n---\nBody`).name).toHaveLength(SKILL_NAME_MAX_LENGTH);
    });
});
