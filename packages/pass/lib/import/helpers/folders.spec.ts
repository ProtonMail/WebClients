import type { FolderData, Maybe, MaybeNull } from '../../../types';
import type { FolderLimits, FoldersById } from '../../folders/folder.utils';
import type { ImportFolder } from '../types';
import { createImportFolderTree, planImportFolders } from './folders';

const LIMITS: FolderLimits = { maxCountPerVault: 100, maxChildren: 10, maxDepth: 5 };

const limits = (overrides: Partial<FolderLimits> = {}): FolderLimits => ({ ...LIMITS, ...overrides });

const existingFolders = (folders: [string, string, MaybeNull<string>][]): FoldersById =>
    folders.reduce<FoldersById>((acc, [folderId, name, parentFolderId]) => {
        acc[folderId] = { folderId, name, parentFolderId, shareId: 'share', vaultId: 'vault', keyRotation: 1 };
        return acc;
    }, {});

/** Full name path from the vault root down to `id`, e.g "a/b/c", by following each folder's parentId */
const pathOf = (create: ImportFolder[], reuse: Record<string, string>, existing: FoldersById, id: string): string => {
    const byId = new Map(create.map((folder) => [folder.id, folder]));
    const segments: string[] = [];
    let current: MaybeNull<string> = id;

    while (current) {
        const folder = byId.get(current);
        if (folder) {
            segments.unshift(folder.name);
            current = folder.parentId;
        } else {
            /* id already exists in the vault */
            let existingFolder: Maybe<FolderData> = existing[reuse[current] ?? current];
            while (existingFolder) {
                segments.unshift(existingFolder.name);
                existingFolder = existingFolder.parentFolderId ? existing[existingFolder.parentFolderId] : undefined;
            }
            current = null;
        }
    }

    return segments.join('/');
};

describe('createImportFolderTree', () => {
    test('returns `null` for an empty path', () => {
        const tree = createImportFolderTree({ separator: '/' });
        expect(tree.add(undefined)).toBeNull();
        expect(tree.add(null)).toBeNull();
        expect(tree.add('')).toBeNull();
        expect(tree.add([])).toBeNull();
        expect(tree.folders).toEqual([]);
    });

    test('adds every folder of a nested path, parent-first', () => {
        const tree = createImportFolderTree({ separator: '/' });
        const leaf = tree.add('a/b/c');

        expect(tree.folders).toHaveLength(3);
        expect(tree.folders.map(({ name }) => name)).toEqual(['a', 'b', 'c']);
        expect(tree.folders[0].parentId).toBeNull();
        expect(tree.folders[1].parentId).toEqual(tree.folders[0].id);
        expect(tree.folders[2].parentId).toEqual(tree.folders[1].id);
        expect(leaf).toEqual(tree.folders[2].id);
    });

    test('dedupes shared ancestors and repeated paths', () => {
        const tree = createImportFolderTree({ separator: '/' });
        const first = tree.add('a/b');
        const second = tree.add('a/c');

        expect(tree.folders.map(({ name }) => name)).toEqual(['a', 'b', 'c']);
        expect(first).not.toEqual(second);
        expect(tree.folders[1].parentId).toEqual(tree.folders[2].parentId);
        expect(tree.add('a/b')).toEqual(first);
        expect(tree.folders).toHaveLength(3);
    });

    test('supports a backslash separator', () => {
        const tree = createImportFolderTree({ separator: '\\' });
        tree.add('folder1\\subfolder1');
        expect(tree.folders.map(({ name }) => name)).toEqual(['folder1', 'subfolder1']);
    });

    test('keeps the whole string as one name when no separator is given', () => {
        const tree = createImportFolderTree();
        tree.add('folder1/folder2');

        expect(tree.folders).toHaveLength(1);
        expect(tree.folders[0]).toEqual({ id: expect.any(String), name: 'folder1/folder2', parentId: null });
    });

    test('accepts an array path without inventing a separator', () => {
        const tree = createImportFolderTree();
        tree.add(['group', 'sub/group']);

        expect(tree.folders.map(({ name }) => name)).toEqual(['group', 'sub/group']);
        expect(tree.folders[1].parentId).toEqual(tree.folders[0].id);
    });

    test('trims names and drops empty segments', () => {
        const tree = createImportFolderTree({ separator: '/' });
        const leaf = tree.add('/folder/  /subfolder ');

        expect(tree.folders.map(({ name }) => name)).toEqual(['folder', 'subfolder']);
        expect(tree.folders[0].parentId).toBeNull();
        expect(leaf).toEqual(tree.folders[1].id);
    });
});

describe('planImportFolders', () => {
    test('creates every folder when no existing folder and no limit', () => {
        const tree = createImportFolderTree({ separator: '/' });
        tree.add('a/b/c');

        const plan = planImportFolders(tree.folders, { existing: {}, limits: limits() });

        expect(plan.create.map(({ name }) => name)).toEqual(['a', 'b', 'c']);
        expect(plan.reuse).toEqual({});
        expect(plan.warnings).toEqual([]);
        tree.folders.forEach(({ id }) => expect(plan.redirect[id]).toEqual(id));
    });

    test('reuses a pre-existing folder of the same name instead of duplicating it', () => {
        const existing = existingFolders([['real-a', 'a', null]]);
        const tree = createImportFolderTree({ separator: '/' });
        const [a, b] = [tree.add('a'), tree.add('a/b')];

        const plan = planImportFolders(tree.folders, { existing, limits: limits() });

        expect(plan.create.map(({ name }) => name)).toEqual(['b']);
        expect(plan.reuse).toEqual({ [a!]: 'real-a' });
        expect(plan.create[0].parentId).toEqual(a);
        expect(plan.redirect[b!]).toEqual(b);
        expect(plan.warnings).toEqual([]);
    });

    test('reuse is scoped to the parent, a same name elsewhere is a new folder', () => {
        const existing = existingFolders([['real-a', 'shared', null]]);
        const tree = createImportFolderTree({ separator: '/' });
        tree.add('other/shared');

        const plan = planImportFolders(tree.folders, { existing, limits: limits() });

        expect(plan.create.map(({ name }) => name)).toEqual(['other', 'shared']);
        expect(plan.reuse).toEqual({});
    });

    describe('depth', () => {
        test('folders beyond depth limit are placed in the deepest allowed folder', () => {
            const tree = createImportFolderTree({ separator: '/' });
            const deep = tree.add('a/b/c/d/e/f');
            const deeper = tree.add('a/b/c/d/e/f/g');
            const sibling = tree.add('a/b/c/d/e/h');
            const other = tree.add('a/b/c/d/z/y');

            const plan = planImportFolders(tree.folders, { existing: {}, limits: limits({ maxDepth: 5 }) });

            expect(plan.create.map(({ name }) => name)).toEqual(['a', 'b', 'c', 'd', 'e', 'z']);
            [deep, deeper, sibling].forEach((id) =>
                expect(pathOf(plan.create, plan.reuse, {}, plan.redirect[id!]!)).toEqual('a/b/c/d/e')
            );
            expect(pathOf(plan.create, plan.reuse, {}, plan.redirect[other!]!)).toEqual('a/b/c/d/z');
            expect(plan.warnings).toHaveLength(1);
            expect(plan.warnings[0]).toContain('4 folders');
        });

        test('counts depth from the vault root through reused ancestors', () => {
            const existing = existingFolders([
                ['real-a', 'a', null],
                ['real-b', 'b', 'real-a'],
            ]);
            const tree = createImportFolderTree({ separator: '/' });
            const leaf = tree.add('a/b/c');

            const plan = planImportFolders(tree.folders, { existing, limits: limits({ maxDepth: 2 }) });

            expect(plan.create).toEqual([]);
            expect(plan.reuse[plan.redirect[leaf!]!]).toEqual('real-b');
        });
    });

    describe('children', () => {
        test('redirects overflowing siblings to their parent', () => {
            const tree = createImportFolderTree({ separator: '/' });
            const kept = tree.add('parent/a');
            const dropped = tree.add('parent/b');

            const plan = planImportFolders(tree.folders, { existing: {}, limits: limits({ maxChildren: 1 }) });

            expect(plan.create.map(({ name }) => name)).toEqual(['parent', 'a']);
            expect(pathOf(plan.create, plan.reuse, {}, plan.redirect[kept!]!)).toEqual('parent/a');
            expect(pathOf(plan.create, plan.reuse, {}, plan.redirect[dropped!]!)).toEqual('parent');
            expect(plan.warnings).toHaveLength(1);
        });

        test('applies at the vault root, overflow lands at the vault root', () => {
            const tree = createImportFolderTree({ separator: '/' });
            const kept = tree.add('a');
            const dropped = tree.add('b');
            const child = tree.add('b/c');

            const plan = planImportFolders(tree.folders, { existing: {}, limits: limits({ maxChildren: 1 }) });

            expect(plan.create.map(({ name }) => name)).toEqual(['a']);
            expect(plan.redirect[kept!]).toEqual(kept);
            expect(plan.redirect[dropped!]).toBeNull();
            expect(plan.redirect[child!]).toBeNull();
        });

        test('counts pre-existing siblings', () => {
            const existing = existingFolders([['real-a', 'a', null]]);
            const tree = createImportFolderTree({ separator: '/' });
            const dropped = tree.add('b');

            const plan = planImportFolders(tree.folders, { existing, limits: limits({ maxChildren: 1 }) });

            expect(plan.create).toEqual([]);
            expect(plan.redirect[dropped!]).toBeNull();
        });

        test('the sibling limit is checked against the parent a folder actually landed on', () => {
            const tree = createImportFolderTree({ separator: '/' });
            tree.add('parent/a');
            const dropped = tree.add('parent/b');
            const belowDropped = tree.add('parent/b/c');

            const plan = planImportFolders(tree.folders, { existing: {}, limits: limits({ maxChildren: 1 }) });

            expect(plan.create.map(({ name }) => name)).toEqual(['parent', 'a']);
            expect(pathOf(plan.create, plan.reuse, {}, plan.redirect[dropped!]!)).toEqual('parent');
            expect(pathOf(plan.create, plan.reuse, {}, plan.redirect[belowDropped!]!)).toEqual('parent');
        });
    });

    describe('count', () => {
        test('stops creating folders once the vault limit is reached', () => {
            const tree = createImportFolderTree({ separator: '/' });
            const kept = tree.add('a/b');
            const dropped = tree.add('a/b/c');

            const plan = planImportFolders(tree.folders, { existing: {}, limits: limits({ maxCountPerVault: 2 }) });

            expect(plan.create.map(({ name }) => name)).toEqual(['a', 'b']);
            expect(pathOf(plan.create, plan.reuse, {}, plan.redirect[kept!]!)).toEqual('a/b');
            expect(pathOf(plan.create, plan.reuse, {}, plan.redirect[dropped!]!)).toEqual('a/b');
        });

        test('counts folders the vault already holds', () => {
            const existing = existingFolders([['real-a', 'a', null]]);
            const tree = createImportFolderTree({ separator: '/' });
            const dropped = tree.add('b');

            const plan = planImportFolders(tree.folders, { existing, limits: limits({ maxCountPerVault: 1 }) });

            expect(plan.create).toEqual([]);
            expect(plan.redirect[dropped!]).toBeNull();
        });
    });
});
