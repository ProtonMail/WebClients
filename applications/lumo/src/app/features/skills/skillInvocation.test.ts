import {
    filterSkillCommands,
    findCommandFile,
    findInvokedCommands,
    findInvokedHandles,
    findSharedHandles,
    findSlashQuery,
    formatSkillCatalogue,
    formatSkillInstructions,
    getCommandFilePaths,
    getLoadableCommands,
    getSkillCommands,
    groupSkillCommands,
    isSkillHandleTaken,
    prependSkillHandle,
    splitSkillTokens,
} from './skillInvocation';
import type { Skill } from './types';

const skill = (overrides: Partial<Skill>): Skill => ({
    id: 'id',
    createdAt: '',
    updatedAt: '',
    skillKey: '',
    name: 'Weekly Report',
    description: 'Status updates',
    instructions: 'Summarize',
    enabled: true,
    source: 'created',
    ...overrides,
});

const plugin = skill({
    id: 'design',
    name: 'Design',
    description: 'Design plugin',
    instructions: '',
    plugin: { version: '1.2.0' },
    subSkills: [
        { path: 'skills/ux-copy', name: 'ux-copy', description: 'Write UX copy', enabled: true },
        { path: 'skills/a11y', name: 'accessibility-review', description: 'Run a WCAG audit', enabled: true },
        { path: 'skills/off', name: 'design-off', description: 'Disabled', enabled: false },
    ],
});

describe('getSkillCommands', () => {
    it('lists enabled skills and enabled sub-skills of enabled plugins', () => {
        const commands = getSkillCommands([
            skill({ id: 'a' }),
            skill({ id: 'b', name: 'Off', enabled: false }),
            plugin,
        ]);
        expect(commands.map(({ handle, group }) => [handle, group])).toEqual([
            ['weekly-report', undefined],
            ['ux-copy', 'Design'],
            ['accessibility-review', 'Design'],
        ]);
    });

    it('drops every sub-skill of a disabled plugin', () => {
        expect(getSkillCommands([{ ...plugin, enabled: false }])).toEqual([]);
    });

    it('keeps the first skill to claim a handle', () => {
        const commands = getSkillCommands([skill({ id: 'a' }), skill({ id: 'b' })]);
        expect(commands.map(({ skillId }) => skillId)).toEqual(['a']);
    });

    it('keeps skills named in non-Latin scripts and drops names without a handle', () => {
        const commands = getSkillCommands([skill({ id: 'a', name: '日本語の要約' }), skill({ id: 'b', name: '🚀' })]);
        expect(commands.map(({ handle }) => handle)).toEqual(['日本語の要約']);
    });
});

describe('findSharedHandles and isSkillHandleTaken', () => {
    const other = skill({ id: 'other', name: 'UX copy', subSkills: undefined });

    it('reports handles of a skill or plugin that another enabled skill also uses', () => {
        const skills = [other, plugin];
        expect(findSharedHandles(skills, 'design')).toEqual(['ux-copy']);
        expect(findSharedHandles(skills, 'other')).toEqual(['ux-copy']);
        expect(findSharedHandles([{ ...other, enabled: false }, plugin], 'design')).toEqual([]);
    });

    it('checks a name against the other skills only', () => {
        expect(isSkillHandleTaken('Ux Copy', [plugin])).toBe(true);
        expect(isSkillHandleTaken('Weekly report', [skill({ id: 'a' })], 'a')).toBe(false);
        expect(isSkillHandleTaken('Weekly report', [skill({ id: 'a' })], 'b')).toBe(true);
        expect(isSkillHandleTaken('🚀', [skill({ id: 'a', name: '🚀' })])).toBe(false);
    });
});

describe('filterSkillCommands and groupSkillCommands', () => {
    const commands = getSkillCommands([skill({ id: 'a', name: 'Audit log', description: 'Logs' }), plugin]);

    it('ranks handle prefixes above other matches', () => {
        expect(filterSkillCommands(commands, 'a').map(({ handle }) => handle)).toEqual([
            'audit-log',
            'accessibility-review',
        ]);
        expect(filterSkillCommands(commands, 'wcag').map(({ handle }) => handle)).toEqual(['accessibility-review']);
    });

    it('puts standalone skills before plugin groups', () => {
        const grouped = groupSkillCommands([commands[2], commands[0], commands[1]]);
        expect(grouped.map(({ handle }) => handle)).toEqual(['audit-log', 'accessibility-review', 'ux-copy']);
    });
});

describe('findSlashQuery', () => {
    it.each([
        ['/', { query: '', start: 0 }],
        ['/ux', { query: 'ux', start: 0 }],
        ['please /acc', { query: 'acc', start: 7 }],
    ])('finds the query in %p', (text, expected) => {
        expect(findSlashQuery(text)).toEqual(expected);
    });

    it.each(['and/or', 'https://example.com/', '/ux copy'])('ignores %p', (text) => {
        expect(findSlashQuery(text)).toBeUndefined();
    });

    it('accepts letters of any script', () => {
        expect(findSlashQuery('please /日本')).toEqual({ query: '日本', start: 7 });
    });
});

describe('findInvokedHandles', () => {
    it('finds standalone handles only', () => {
        expect(findInvokedHandles('/ux-copy fix this, then /accessibility-review. Not and/or or http://x/y')).toEqual([
            'ux-copy',
            'accessibility-review',
        ]);
    });

    it('normalises tokens the way skill names are', () => {
        expect(findInvokedHandles('/Café-Notes and /日本語の要約。 /Отчёт')).toEqual([
            'cafe-notes',
            '日本語の要約',
            'отчёт',
        ]);
    });
});

describe('splitSkillTokens', () => {
    it('marks only known handles as skills', () => {
        expect(
            splitSkillTokens('/design-system fix\n/unknown and /ux-copy.', new Set(['design-system', 'ux-copy']))
        ).toEqual([
            { text: '/design-system', isSkill: true },
            { text: ' fix\n/unknown and ', isSkill: false },
            { text: '/ux-copy', isSkill: true },
            { text: '.', isSkill: false },
        ]);
    });

    it('returns the text unchanged when there are no skills', () => {
        expect(splitSkillTokens('and/or', new Set(['or']))).toEqual([{ text: 'and/or', isSkill: false }]);
    });
});

describe('prependSkillHandle', () => {
    it('puts the handle before the draft', () => {
        expect(prependSkillHandle('', 'summarize')).toBe('/summarize ');
        expect(prependSkillHandle('  this report', 'summarize')).toBe('/summarize this report');
    });

    it('leaves a draft that already invokes the skill', () => {
        expect(prependSkillHandle('please /summarize this', 'summarize')).toBe('please /summarize this');
    });
});

describe('findInvokedCommands', () => {
    it('matches handles across messages without duplicates', () => {
        const commands = getSkillCommands([plugin]);
        const invoked = findInvokedCommands(commands, ['/ux-copy one', '/unknown /ux-copy two /accessibility-review']);
        expect(invoked.map(({ handle, subSkillPath }) => [handle, subSkillPath])).toEqual([
            ['ux-copy', 'skills/ux-copy'],
            ['accessibility-review', 'skills/a11y'],
        ]);
    });
});

describe('formatSkillInstructions', () => {
    it('wraps each skill and skips empty ones', () => {
        expect(
            formatSkillInstructions([
                { handle: 'ux-copy', instructions: ' Write clearly ' },
                { handle: 'empty', instructions: '  ' },
            ])
        ).toBe('[Skill /ux-copy: the user invoked this skill. Follow its instructions.\nWrite clearly]');
        expect(formatSkillInstructions([])).toBeUndefined();
    });

    it('lists the files of each skill only when the read tool is offered', () => {
        const skills = [{ handle: 'pdf', instructions: 'See references/api.md', files: ['references/api.md'] }];
        expect(formatSkillInstructions(skills)).not.toContain('Files in this skill');
        expect(formatSkillInstructions(skills, 'read_skill_file')).toContain(
            "read one with the read_skill_file tool when the instructions refer to it; scripts can't be run): references/api.md]"
        );
    });
});

describe('getCommandFilePaths and findCommandFile', () => {
    const files = [
        { path: 'references/shared.md' },
        { path: 'skills/pdf/SKILL.md' },
        { path: 'skills/pdf/references/api.md' },
        { path: 'skills/other/SKILL.md' },
        { path: 'skills/other/notes.md' },
    ];
    const subSkillPaths = ['skills/pdf', 'skills/other'];
    const root = {};
    const pdf = { subSkillPath: 'skills/pdf' };

    it("lists a root skill's shared files and a sub-skill's own folder", () => {
        expect(getCommandFilePaths(root, files, subSkillPaths)).toEqual(['references/shared.md']);
        expect(getCommandFilePaths(pdf, files, subSkillPaths)).toEqual(['references/api.md']);
        expect(getCommandFilePaths(root, files, [])).toEqual(files.map(({ path }) => path));
    });

    it.each([
        ['references/api.md', 'skills/pdf/references/api.md'],
        ['./references/api.md', 'skills/pdf/references/api.md'],
        ['../../references/shared.md', 'references/shared.md'],
        ['/references/shared.md', 'references/shared.md'],
        ['references/shared.md', 'references/shared.md'],
    ])('resolves %p from a sub-skill', (path, expected) => {
        expect(findCommandFile(pdf, files, path, subSkillPaths)?.path).toBe(expected);
    });

    it.each(['../../../etc/passwd', 'missing.md', 'https://example.com/a.md'])('finds nothing for %p', (path) => {
        expect(findCommandFile(pdf, files, path, subSkillPaths)).toBeUndefined();
    });

    it("keeps other sub-skills' files out of reach", () => {
        expect(findCommandFile(pdf, files, '../other/notes.md', subSkillPaths)).toBeUndefined();
        expect(findCommandFile(pdf, files, '/skills/other/notes.md', subSkillPaths)).toBeUndefined();
        expect(findCommandFile(pdf, files, '/skills/other', subSkillPaths)).toBeUndefined();
        expect(findCommandFile(root, files, 'skills/pdf/references/api.md', subSkillPaths)).toBeUndefined();
    });

    it('gives a file in a nested sub-skill folder to the deepest sub-skill', () => {
        const nested = [{ path: 'skills/pdf/forms/SKILL.md' }, { path: 'skills/pdf/forms/template.md' }];
        const paths = [...subSkillPaths, 'skills/pdf/forms'];
        expect(findCommandFile(pdf, nested, 'forms/template.md', paths)).toBeUndefined();
        expect(findCommandFile({ subSkillPath: 'skills/pdf/forms' }, nested, 'template.md', paths)?.path).toBe(
            'skills/pdf/forms/template.md'
        );
    });
});

describe('getLoadableCommands', () => {
    it('leaves out skills the user already invoked', () => {
        const commands = getSkillCommands([skill({ id: 'a' }), plugin]);
        const invoked = findInvokedCommands(commands, ['/ux-copy please']);
        expect(getLoadableCommands(commands, invoked).map(({ handle }) => handle)).toEqual([
            'weekly-report',
            'accessibility-review',
        ]);
    });

    it('caps the list', () => {
        const many = Array.from({ length: 60 }, (_, index) => skill({ id: `s${index}`, name: `Skill ${index}` }));
        expect(getLoadableCommands(getSkillCommands(many), [])).toHaveLength(50);
    });
});

describe('formatSkillCatalogue', () => {
    it('lists each skill with a one-line, shortened description', () => {
        const commands = getSkillCommands([
            skill({ id: 'a', description: 'Status\n  updates' }),
            skill({ id: 'b', name: 'Long', description: 'x'.repeat(300) }),
            skill({ id: 'c', name: 'Bare', description: '' }),
        ]);
        const catalogue = formatSkillCatalogue(commands, 'use_skill');
        expect(catalogue).toContain('call the use_skill tool');
        expect(catalogue).toContain(`- weekly-report: Status updates\n- long: ${'x'.repeat(200)}\n- bare]`);
    });

    it('is empty without skills', () => {
        expect(formatSkillCatalogue([], 'use_skill')).toBeUndefined();
    });
});
