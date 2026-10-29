import { resolveSkillLink } from './skillLinks';

const paths = [
    'README.md',
    'CONNECTORS.md',
    '.claude-plugin/plugin.json',
    'skills/accessibility-review/SKILL.md',
    'skills/accessibility-review/references/wcag.md',
    'skills/ux-copy/SKILL.md',
];

const from = 'skills/accessibility-review/SKILL.md';

describe('resolveSkillLink', () => {
    it('resolves relative links against the linking file', () => {
        expect(resolveSkillLink(from, '../../CONNECTORS.md', paths)).toEqual({ kind: 'file', path: 'CONNECTORS.md' });
        expect(resolveSkillLink(from, './references/wcag.md#contrast', paths)).toEqual({
            kind: 'file',
            path: 'skills/accessibility-review/references/wcag.md',
        });
        expect(resolveSkillLink('README.md', 'skills/ux-copy/SKILL.md', paths)).toEqual({
            kind: 'file',
            path: 'skills/ux-copy/SKILL.md',
        });
    });

    it('resolves root links against the bundle root', () => {
        expect(resolveSkillLink(from, '/CONNECTORS.md', paths)).toEqual({ kind: 'file', path: 'CONNECTORS.md' });
    });

    it('opens the entry file of a linked folder', () => {
        expect(resolveSkillLink('README.md', 'skills/ux-copy/', paths)).toEqual({
            kind: 'file',
            path: 'skills/ux-copy/SKILL.md',
        });
        expect(resolveSkillLink('README.md', '.claude-plugin', paths)).toEqual({
            kind: 'file',
            path: '.claude-plugin/plugin.json',
        });
    });

    it('decodes encoded paths', () => {
        expect(resolveSkillLink('README.md', 'skills/ux%2Dcopy/SKILL.md', paths)).toEqual({
            kind: 'file',
            path: 'skills/ux-copy/SKILL.md',
        });
    });

    it('reports files that are not in the bundle', () => {
        expect(resolveSkillLink(from, 'missing.md', paths)).toEqual({
            kind: 'missing',
            path: 'skills/accessibility-review/missing.md',
        });
    });

    it('keeps web links external and blocks unsafe ones', () => {
        expect(resolveSkillLink(from, 'https://www.w3.org/WAI/', paths)).toEqual({
            kind: 'external',
            url: 'https://www.w3.org/WAI/',
        });
        expect(resolveSkillLink(from, 'javascript:alert(1)', paths)).toEqual({ kind: 'blocked' });
        expect(resolveSkillLink(from, '//evil.example', paths)).toEqual({ kind: 'blocked' });
        expect(resolveSkillLink(from, '../../../outside.md', paths)).toEqual({ kind: 'blocked' });
    });

    it('treats in-page anchors as anchors', () => {
        expect(resolveSkillLink(from, '#usage', paths)).toEqual({ kind: 'anchor' });
    });
});
