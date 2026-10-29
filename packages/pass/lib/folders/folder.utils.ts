import type { FolderId } from '../../types/crypto/pass-types';
import type { FolderData } from '../../types/data/folders';
import type { Maybe, MaybeNull } from '../../types/utils';

export type FoldersById = Record<FolderId, FolderData>;
export type FolderChildren = ReadonlyMap<MaybeNull<FolderId>, readonly FolderData[]>;

const EMPTY_CHILDREN: FolderChildren = new Map();
const childrenCache = new WeakMap<FoldersById, FolderChildren>();

/** Groups a share's folders by parent id, each sibling list sorted by name. The result
 * is cached in a WeakMap keyed by the folders object, so it is reused while that object
 * stays the same: the reducer replaces it on any folder change, which rebuilds the map
 * and frees the previous one. */
export const getFolderChildren = (shareFolders: Maybe<FoldersById>): FolderChildren => {
    if (!shareFolders) return EMPTY_CHILDREN;

    const cached = childrenCache.get(shareFolders);
    if (cached) return cached;

    const children = new Map<MaybeNull<FolderId>, FolderData[]>();

    for (const folder of Object.values(shareFolders)) {
        const siblings = children.get(folder.parentFolderId);
        if (siblings) siblings.push(folder);
        else children.set(folder.parentFolderId, [folder]);
    }

    children.forEach((siblings) => siblings.sort((a, b) => a.name.localeCompare(b.name)));

    childrenCache.set(shareFolders, children);
    return children;
};

/** Ordered root -> ... -> leaf folder path, empty if no folder */
export const resolveFolderPath = (shareFolders: Maybe<FoldersById>, folderId: MaybeNull<string>): FolderData[] => {
    const path: FolderData[] = [];
    let current: Maybe<FolderData> = folderId ? shareFolders?.[folderId] : undefined;
    while (current) {
        path.unshift(current);
        current = current.parentFolderId ? shareFolders?.[current.parentFolderId] : undefined;
    }
    return path;
};

/** Returns folderId itself + all its descendant folder ids, empty if no folder. */
export const getFolderAndDescendantIds = (
    shareFolders: Maybe<FoldersById>,
    folderId: MaybeNull<string>
): Set<string> => {
    const ids = new Set<string>();
    if (!folderId) return ids;

    const children = getFolderChildren(shareFolders);
    const stack = [folderId];
    while (stack.length) {
        const current = stack.pop();
        if (current === undefined || ids.has(current)) continue;
        ids.add(current);
        for (const child of children.get(current) ?? []) stack.push(child.folderId);
    }

    return ids;
};

export type FolderScope = ReadonlySet<MaybeNull<FolderId>>;

/** Items that are in no folder, ie. in the vault root. */
const ROOT_SCOPE: FolderScope = new Set([null]);

/** Returns the folder ids to list items from: the selected level only, and all its
 * subfolders only when searching. `undefined` when no folder filtering applies. */
export const getFolderScope = (
    shareFolders: Maybe<FoldersById>,
    folderId: MaybeNull<FolderId>,
    search: boolean
): Maybe<FolderScope> => {
    if (!folderId) return search ? undefined : ROOT_SCOPE;
    return search ? getFolderAndDescendantIds(shareFolders, folderId) : new Set([folderId]);
};

export type FolderLimits = { maxCountPerVault: number; maxChildren: number; maxDepth: number };

export type FolderLimitReason = 'count' | 'children' | 'depth';

/** Placement of a folder about to be created: how many folders the vault already
 * has, how many siblings the target parent already has, and the parent's own
 * depth (e.g 0 for the vault root, 1 a top-level folder). */
export type FolderPlacement = { total: number; siblings: number; parentDepth: number };

export const getFolderLimitReason = (
    { total, siblings, parentDepth }: FolderPlacement,
    { maxCountPerVault, maxChildren, maxDepth }: FolderLimits
): MaybeNull<FolderLimitReason> => {
    if (total >= maxCountPerVault) return 'count';
    if (siblings >= maxChildren) return 'children';
    if (parentDepth >= maxDepth) return 'depth';
    return null;
};

/** Number of folder levels below folderId, 0 for a folder without sub-folders. */
export const getFolderSubtreeHeight = (shareFolders: Maybe<FoldersById>, folderId: FolderId): number => {
    const children = getFolderChildren(shareFolders).get(folderId) ?? [];
    let height = 0;

    for (const child of children) {
        const childHeight = 1 + getFolderSubtreeHeight(shareFolders, child.folderId);
        height = Math.max(height, childHeight);
    }

    return height;
};

export type FolderMoveBlockReason = 'current' | 'descendant' | Exclude<FolderLimitReason, 'count'>;

/** Truthy if the move should be blocked, null if the move is allowed. */
export const getFolderMoveBlockReason = (
    shareFolders: Maybe<FoldersById>,
    folderId: FolderId,
    targetParentFolderId: MaybeNull<FolderId>,
    { maxChildren, maxDepth }: FolderLimits
): MaybeNull<FolderMoveBlockReason> => {
    const folder = shareFolders?.[folderId];
    if (!folder || folder.parentFolderId === targetParentFolderId) return 'current';
    const movesIntoItself =
        targetParentFolderId && getFolderAndDescendantIds(shareFolders, folderId).has(targetParentFolderId);
    if (movesIntoItself) return 'descendant';

    const siblings = getFolderChildren(shareFolders).get(targetParentFolderId)?.length ?? 0;
    if (siblings >= maxChildren) return 'children';

    const targetDepth = resolveFolderPath(shareFolders, targetParentFolderId).length;
    if (targetDepth + 1 + getFolderSubtreeHeight(shareFolders, folderId) > maxDepth) return 'depth';

    return null;
};
