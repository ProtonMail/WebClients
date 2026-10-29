import { buildSkillMarkdown, getSkillHandle, parseSkillMarkdown } from './skillMarkdown';

describe('parseSkillMarkdown', () => {
    it('reads plain, quoted and block scalars', () => {
        const markdown = [
            '---',
            'name: Release notes',
            'description: "Writes notes: short and clear"',
            "license: 'MIT'",
            'notes: |',
            '  line one',
            '  line two',
            'summary: >',
            '  folded',
            '  text',
            '---',
            '',
            '# Steps',
        ].join('\n');

        expect(parseSkillMarkdown(markdown)).toEqual({
            frontmatter: {
                name: 'Release notes',
                description: 'Writes notes: short and clear',
                license: 'MIT',
                notes: 'line one\nline two',
                summary: 'folded text',
            },
            body: '# Steps',
        });
    });

    it('returns the whole text as body without frontmatter', () => {
        expect(parseSkillMarkdown('Just text')).toEqual({ frontmatter: {}, body: 'Just text' });
    });

    it('round-trips through buildSkillMarkdown', () => {
        const built = buildSkillMarkdown({
            name: 'Tricky: name',
            description: 'Uses "quotes"',
            instructions: 'Do the thing',
            metadata: { version: '1.0' },
        });
        expect(parseSkillMarkdown(built)).toEqual({
            frontmatter: { name: 'Tricky: name', description: 'Uses "quotes"', version: '1.0' },
            body: 'Do the thing',
        });
    });
});

describe('getSkillHandle', () => {
    it('makes a lowercase hyphenated handle', () => {
        expect(getSkillHandle('  Café Notes & To-dos! ')).toBe('cafe-notes-to-dos');
    });

    it('keeps letters from non-Latin scripts', () => {
        expect(getSkillHandle('日本語の要約')).toBe('日本語の要約');
        expect(getSkillHandle('Отчёт за неделю')).toBe('отчёт-за-неделю');
        expect(getSkillHandle('हिंदी सारांश')).toBe('हिंदी-सारांश');
        expect(getSkillHandle('한국어 요약')).toBe('한국어-요약');
    });

    it('is empty when the name has no letters or numbers', () => {
        expect(getSkillHandle('✨ 🚀 !!')).toBe('');
    });
});
