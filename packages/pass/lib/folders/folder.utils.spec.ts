import type { FolderData } from '../../types/data/folders';
import type { MaybeNull } from '../../types/utils';
import {
    getFolderAndDescendantIds,
    getFolderChildren,
    getFolderMoveBlockReason,
    getFolderScope,
    getFolderSubtreeHeight,
    resolveFolderPath,
} from './folder.utils';

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

describe('getFolderSubtreeHeight', () => {
    test('returns the number of levels below a folder', () => {
        const tree = buildTree();
        expect(getFolderSubtreeHeight(tree, 'a')).toBe(2);
        expect(getFolderSubtreeHeight(tree, 'b')).toBe(1);
        expect(getFolderSubtreeHeight(tree, 'c')).toBe(0);
        expect(getFolderSubtreeHeight(tree, 'e')).toBe(0);
    });
});

describe('getFolderMoveBlockReason', () => {
    const limits = { maxCountPerVault: 100, maxChildren: 10, maxDepth: 5 };

    test('allows moving to another folder or to the vault root', () => {
        const tree = buildTree();
        expect(getFolderMoveBlockReason(tree, 'e', 'c', limits)).toBeNull();
        expect(getFolderMoveBlockReason(tree, 'b', null, limits)).toBeNull();
    });

    test('blocks moving to the current parent', () => {
        const tree = buildTree();
        expect(getFolderMoveBlockReason(tree, 'b', 'a', limits)).toBe('current');
        expect(getFolderMoveBlockReason(tree, 'a', null, limits)).toBe('current');
    });

    test('blocks moving into itself or one of its sub-folders', () => {
        const tree = buildTree();
        expect(getFolderMoveBlockReason(tree, 'a', 'a', limits)).toBe('descendant');
        expect(getFolderMoveBlockReason(tree, 'a', 'c', limits)).toBe('descendant');
    });

    test('blocks when the target has too many sub-folders', () => {
        const tree = buildTree();
        expect(getFolderMoveBlockReason(tree, 'e', 'a', { ...limits, maxChildren: 2 })).toBe('children');
    });

    test('blocks when the moved folder and its sub-folders would be too deep', () => {
        const tree = buildTree();
        expect(getFolderMoveBlockReason(tree, 'a', 'e', { ...limits, maxDepth: 4 })).toBeNull();
        expect(getFolderMoveBlockReason(tree, 'a', 'e', { ...limits, maxDepth: 3 })).toBe('depth');
    });
});
