import { groupPickedFolderFiles } from './skillFolderInput';

const picked = (path: string) => {
    const file = new File(['x'], path.split('/').pop() ?? path);
    Object.defineProperty(file, 'webkitRelativePath', { value: path });
    return file;
};

const summarize = (paths: string[]) =>
    groupPickedFolderFiles(paths.map(picked)).map((item) =>
        item.kind === 'folder' ? { name: item.name, paths: item.files.map(({ path }) => path) } : item
    );

describe('groupPickedFolderFiles', () => {
    it('keeps a single skill folder as one item', () => {
        expect(summarize(['notes/SKILL.md', 'notes/scripts/run.py'])).toEqual([
            { name: 'notes', paths: ['notes/SKILL.md', 'notes/scripts/run.py'] },
        ]);
    });

    it('splits a folder of skills into one item per skill', () => {
        expect(summarize(['skills/a/SKILL.md', 'skills/b/SKILL.md', 'skills/b/ref.md', 'skills/.DS_Store'])).toEqual([
            { name: 'a', paths: ['a/SKILL.md'] },
            { name: 'b', paths: ['b/SKILL.md', 'b/ref.md'] },
        ]);
    });

    it('keeps plugins and folders with a README together', () => {
        expect(summarize(['design/.codex-plugin/plugin.json', 'design/skills/a/SKILL.md'])).toHaveLength(1);
        expect(summarize(['mine/README.md', 'mine/a/SKILL.md', 'mine/b/SKILL.md'])).toHaveLength(1);
    });
});
