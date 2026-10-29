import { isBlockedSkillFile, normalizeSkillFilePath } from './skillFiles';

describe('normalizeSkillFilePath', () => {
    it.each([
        ['scripts/run.py', 'scripts/run.py'],
        ['./docs//guide.md', 'docs/guide.md'],
        ['docs\\guide.md', 'docs/guide.md'],
    ])('normalizes %s', (input, expected) => {
        expect(normalizeSkillFilePath(input)).toBe(expected);
    });

    it.each(['/etc/passwd', '../secret.md', 'docs/../../x.md', '', '   '])('rejects %p', (input) => {
        expect(normalizeSkillFilePath(input)).toBeUndefined();
    });
});

describe('isBlockedSkillFile', () => {
    it('blocks executables but allows scripts and docs', () => {
        expect(isBlockedSkillFile('bin/tool.exe')).toBe(true);
        expect(isBlockedSkillFile('lib/native.dylib')).toBe(true);
        expect(isBlockedSkillFile('scripts/run.py')).toBe(false);
        expect(isBlockedSkillFile('README.md')).toBe(false);
    });
});
