import { setSkillMarkdownName } from '../skillMarkdown';
import {
    type Workspace,
    createWorkspaceEntry,
    getAvailableFolderPath,
    removeWorkspaceEntry,
    renameWorkspaceEntry,
} from './skillWorkspace';

const file = (path: string, text = '') => ({ path, mimeType: 'text/markdown', text });

const workspace: Workspace = {
    files: [
        file('SKILL.md'),
        file('skills/new-skill/SKILL.md', '---\nname: new-skill\ndescription: Does it\n---\n\nBody\n'),
        file('skills/new-skill/references/guide.md', 'Guide'),
        file('skills/other/SKILL.md', '---\nname: Other\n---\n'),
    ],
    folders: ['assets'],
};

describe('getAvailableFolderPath', () => {
    it('numbers the folder when the name is taken', () => {
        expect(getAvailableFolderPath(workspace, 'skills', 'report')).toBe('skills/report');
        expect(getAvailableFolderPath(workspace, 'skills', 'new-skill')).toBe('skills/new-skill-2');
        expect(getAvailableFolderPath(workspace, '', 'assets')).toBe('assets-2');
    });
});

describe('createWorkspaceEntry', () => {
    it('adds an empty file in the folder and drops that folder from the empty ones', () => {
        expect(createWorkspaceEntry(workspace, 'assets', 'logo.svg', 'file')).toEqual({
            path: 'assets/logo.svg',
            workspace: {
                files: [...workspace.files, { path: 'assets/logo.svg', mimeType: 'image/svg+xml', text: '' }],
                folders: [],
            },
        });
    });

    it('adds an empty folder, creating the folders on the way', () => {
        expect(createWorkspaceEntry(workspace, '', 'references/examples', 'folder')).toEqual({
            path: 'references/examples',
            workspace: { files: workspace.files, folders: ['assets', 'references/examples'] },
        });
    });

    it('refuses taken, invalid and executable names', () => {
        expect(createWorkspaceEntry(workspace, 'skills', 'other', 'file')).toEqual({ error: 'taken' });
        expect(createWorkspaceEntry(workspace, '', 'SKILL.md/x', 'file')).toEqual({ error: 'taken' });
        expect(createWorkspaceEntry(workspace, '', '../x.md', 'file')).toEqual({ error: 'invalid' });
        expect(createWorkspaceEntry(workspace, '', 'docs/', 'file')).toEqual({ error: 'invalid' });
        expect(createWorkspaceEntry(workspace, '', 'run.exe', 'file')).toEqual({ error: 'blocked' });
    });
});

describe('renameWorkspaceEntry', () => {
    it('moves a folder with its files and renames a skill still named after it', () => {
        const result = renameWorkspaceEntry(workspace, 'skills/new-skill', ' report ', 'folder');

        expect(result).toEqual({
            path: 'skills/report',
            workspace: {
                files: [
                    workspace.files[0],
                    file('skills/report/SKILL.md', '---\nname: report\ndescription: Does it\n---\n\nBody\n'),
                    file('skills/report/references/guide.md', 'Guide'),
                    workspace.files[3],
                ],
                folders: ['assets'],
            },
        });
    });

    it('keeps a skill name the user chose', () => {
        const result = renameWorkspaceEntry(workspace, 'skills/other', 'renamed', 'folder');

        expect('workspace' in result && result.workspace.files[3]).toEqual(
            file('skills/renamed/SKILL.md', '---\nname: Other\n---\n')
        );
    });

    it('renames a file in place and updates its type', () => {
        const result = renameWorkspaceEntry(workspace, 'skills/new-skill/references/guide.md', 'guide.txt', 'file');

        expect('workspace' in result && result.workspace.files[2]).toEqual({
            path: 'skills/new-skill/references/guide.txt',
            mimeType: 'text/plain',
            text: 'Guide',
        });
    });

    it('renames an empty folder', () => {
        expect(renameWorkspaceEntry(workspace, 'assets', 'images', 'folder')).toEqual({
            path: 'images',
            workspace: { files: workspace.files, folders: ['images'] },
        });
    });

    it('refuses names that are paths or already used', () => {
        expect(renameWorkspaceEntry(workspace, 'skills/other', 'a/b', 'folder')).toEqual({ error: 'invalid' });
        expect(renameWorkspaceEntry(workspace, 'skills/other', '..', 'folder')).toEqual({ error: 'invalid' });
        expect(renameWorkspaceEntry(workspace, 'skills/other', ' ', 'folder')).toEqual({ error: 'invalid' });
        expect(renameWorkspaceEntry(workspace, 'skills/other', 'new-skill', 'folder')).toEqual({ error: 'taken' });
        expect(renameWorkspaceEntry(workspace, 'SKILL.md', 'run.exe', 'file')).toEqual({ error: 'blocked' });
    });

    it('does nothing when the name is unchanged', () => {
        expect(renameWorkspaceEntry(workspace, 'skills/other', 'other', 'folder')).toEqual({
            workspace,
            path: 'skills/other',
        });
    });
});

describe('removeWorkspaceEntry', () => {
    it('removes a folder with everything in it', () => {
        expect(removeWorkspaceEntry(workspace, 'skills/new-skill', 'folder')).toEqual({
            files: [workspace.files[0], workspace.files[3]],
            folders: ['assets'],
        });
        expect(removeWorkspaceEntry(workspace, 'assets', 'folder')).toEqual({ files: workspace.files, folders: [] });
    });

    it('removes one file only', () => {
        expect(removeWorkspaceEntry(workspace, 'skills/other/SKILL.md', 'file').files).toHaveLength(3);
    });
});

describe('setSkillMarkdownName', () => {
    it('only changes the name line of the frontmatter', () => {
        expect(setSkillMarkdownName('---\nname: a\nlicense: MIT\n---\n\nname: body\n', 'b: c')).toBe(
            '---\nname: "b: c"\nlicense: MIT\n---\n\nname: body\n'
        );
        expect(setSkillMarkdownName('No frontmatter', 'b')).toBe('No frontmatter');
    });
});
