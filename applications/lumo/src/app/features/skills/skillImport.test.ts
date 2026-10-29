import JSZip from 'jszip';

import { importSkillFiles, importSkillFolder } from './skillImport';

const SKILL_MD = '---\nname: Notes\ndescription: Takes notes\nversion: 2\n---\n\nWrite notes.';

const zipFile = async (name: string, entries: Record<string, string>) => {
    const zip = new JSZip();
    Object.entries(entries).forEach(([path, content]) => zip.file(path, content));
    return new File([await zip.generateAsync({ type: 'arraybuffer' })], name);
};

describe('importSkillFiles', () => {
    it('imports a SKILL.md file', async () => {
        const [result] = await importSkillFiles([new File([SKILL_MD], 'SKILL.md')]);
        expect(result.draft).toMatchObject({
            name: 'Notes',
            description: 'Takes notes',
            instructions: 'Write notes.',
            metadata: { version: '2' },
            source: 'uploaded',
            files: [],
        });
    });

    it('rejects markdown without name and description', async () => {
        const [result] = await importSkillFiles([new File(['# Hi'], 'notes.md')]);
        expect(result.error).toBeDefined();
    });

    it('imports a bundle nested in one top-level folder', async () => {
        const file = await zipFile('notes.skill', {
            'notes/SKILL.md': SKILL_MD,
            'notes/scripts/run.py': 'print(1)',
            '__MACOSX/notes/._SKILL.md': 'junk',
        });
        const [result] = await importSkillFiles([file]);
        expect(result.draft?.name).toBe('Notes');
        expect(result.draft?.files.map((f) => f.path)).toEqual(['scripts/run.py']);
    });

    it('rejects archives without SKILL.md or with executables', async () => {
        const [missing, executable] = await importSkillFiles([
            await zipFile('a.zip', { 'README.md': 'x' }),
            await zipFile('b.zip', { 'SKILL.md': SKILL_MD, 'tool.exe': 'x' }),
        ]);
        expect(missing.error).toBeDefined();
        expect(executable.error).toBeDefined();
    });

    const pluginEntries = {
        'Design-1.2.0-v1/.claude-plugin/plugin.json': JSON.stringify({
            name: 'design',
            version: '1.2.0',
            description: 'Accelerate design workflows',
            author: { name: 'Anthropic' },
        }),
        'Design-1.2.0-v1/.mcp.json': JSON.stringify({
            mcpServers: { figma: { type: 'http', url: 'https://mcp.figma.com/mcp' } },
        }),
        'Design-1.2.0-v1/README.md': '# Design Plugin\n\nHelps with design.',
        'Design-1.2.0-v1/skills/ux-copy/SKILL.md': '---\nname: ux-copy\ndescription: Write UX copy\n---\n\nBody',
        'Design-1.2.0-v1/skills/accessibility-review/SKILL.md':
            '---\nname: accessibility-review\ndescription: Run a WCAG audit\n---\n\nBody',
        'Design-1.2.0-v1/.DS_Store': 'junk',
    };

    it('imports a Claude plugin with sub-skills from a zip', async () => {
        const [result] = await importSkillFiles([await zipFile('design.zip', pluginEntries)]);
        expect(result.draft).toMatchObject({
            name: 'design',
            description: 'Accelerate design workflows',
            instructions: '',
        });
        expect(result.draft?.files.map((f) => f.path).sort()).toEqual([
            '.claude-plugin/plugin.json',
            '.mcp.json',
            'README.md',
            'skills/accessibility-review/SKILL.md',
            'skills/ux-copy/SKILL.md',
        ]);
    });

    it('imports a picked plugin folder', async () => {
        const files = Object.entries(pluginEntries).map(([path, content]) => ({
            path,
            file: new File([content], path),
        }));
        const result = await importSkillFolder('Design-1.2.0-v1', files);
        expect(result.draft?.name).toBe('design');
        expect(result.draft?.files).toHaveLength(5);
    });

    it('imports a folder of skills without a manifest', async () => {
        const result = await importSkillFolder('my-skills', [
            { path: 'my-skills/README.md', file: new File(['# Mine\n\nMy favourite skills.'], 'README.md') },
            { path: 'my-skills/a/SKILL.md', file: new File(['---\nname: a\ndescription: A\n---\n'], 'SKILL.md') },
        ]);
        expect(result.draft).toMatchObject({ name: 'my-skills', description: 'My favourite skills.' });
    });

    it('rejects a plugin whose sub-skill has no frontmatter', async () => {
        const [result] = await importSkillFiles([
            await zipFile('bad.zip', {
                ...pluginEntries,
                'Design-1.2.0-v1/skills/broken/SKILL.md': '# No frontmatter',
            }),
        ]);
        expect(result.error).toContain('skills/broken/SKILL.md');
    });

    it('rejects unsupported file types', async () => {
        const [result] = await importSkillFiles([new File(['x'], 'skill.txt')]);
        expect(result.error).toBeDefined();
    });
});
