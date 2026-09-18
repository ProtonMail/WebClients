import type { FolderData, MaybeNull } from '../../types';
import { getFolderAndDescendantIds, getFolderChildren, getFolderScope, resolveFolderPath } from './folder.utils';

const mockFolder = (folderId: string, parentFolderId: MaybeNull<string>): FolderData => ({
    folderId,
    shareId: 'share1',
    vaultId: 'vault1',
    parentFolderId,
    name: folderId,
    keyRotation: 1,
});

/** a -> b -> c and a -> d, and top-level e */
const buildTree = (): Record<string, FolderData> =>
    [
        mockFolder('a', null),
        mockFolder('b', 'a'),
        mockFolder('c', 'b'),
        mockFolder('d', 'a'),
        mockFolder('e', null),
    ].reduce<Record<string, FolderData>>((acc, folder) => ({ ...acc, [folder.folderId]: folder }), {});

describe('getFolderChildren', () => {
    const childIds = (tree: Record<string, FolderData>, parentFolderId: MaybeNull<string>) =>
        (getFolderChildren(tree).get(parentFolderId) ?? []).map((folder) => folder.folderId);

    test('groups folders by parent folder id', () => {
        const tree = buildTree();
        expect(childIds(tree, null)).toEqual(['a', 'e']);
        expect(childIds(tree, 'a')).toEqual(['b', 'd']);
        expect(childIds(tree, 'b')).toEqual(['c']);
        expect(childIds(tree, 'c')).toEqual([]);
    });

    test('handles missing folders', () => {
        expect(getFolderChildren(undefined).size).toBe(0);
        expect(getFolderChildren({}).size).toBe(0);
    });

    test('caches per folders object reference', () => {
        const tree = buildTree();
        expect(getFolderChildren(tree)).toBe(getFolderChildren(tree));
        expect(getFolderChildren(buildTree())).not.toBe(getFolderChildren(tree));
    });
});

describe('getFolderAndDescendantIds', () => {
    test('returns empty set when no folder is selected', () => {
        expect(getFolderAndDescendantIds(buildTree(), null).size).toBe(0);
    });

    test('includes the folder itself when it has no children (leaf)', () => {
        expect([...getFolderAndDescendantIds(buildTree(), 'c')]).toEqual(['c']);
    });

    test('collects the folder and all descendants', () => {
        expect(getFolderAndDescendantIds(buildTree(), 'a')).toEqual(new Set(['a', 'b', 'c', 'd']));
    });

    test('collects a mid-tree subtree only', () => {
        expect(getFolderAndDescendantIds(buildTree(), 'b')).toEqual(new Set(['b', 'c']));
    });

    test('excludes unrelated sibling branches', () => {
        expect(getFolderAndDescendantIds(buildTree(), 'a').has('e')).toBe(false);
    });
});

describe('resolveFolderPath', () => {
    test('returns root -> leaf ordered path', () => {
        expect(resolveFolderPath(buildTree(), 'c').map((folder) => folder.folderId)).toEqual(['a', 'b', 'c']);
    });

    test('returns empty path when no folder is selected', () => {
        expect(resolveFolderPath(buildTree(), null)).toEqual([]);
    });
});

describe('getFolderScope', () => {
    test('scopes to the vault root when no folder is selected', () => {
        expect(getFolderScope(buildTree(), null, false)).toEqual(new Set([null]));
    });

    test('scopes to the selected folder only', () => {
        expect(getFolderScope(buildTree(), 'a', false)).toEqual(new Set(['a']));
    });

    test('returns undefined when searching from the vault root: no filtering is done', () => {
        expect(getFolderScope(buildTree(), null, true)).toBeUndefined();
    });

    test('includes the selected folder and its descendants when searching', () => {
        expect(getFolderScope(buildTree(), 'a', true)).toEqual(new Set(['a', 'b', 'c', 'd']));
    });
});
