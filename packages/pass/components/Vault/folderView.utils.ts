import type { FolderChildren } from '../../lib/folders/folder.utils';
import { getFolderChildren, resolveFolderPath } from '../../lib/folders/folder.utils';
import { getFolderKey } from '../../lib/items/item.utils';
import type { FoldersByShareId } from '../../store/reducers';
import type { FolderData, MaybeNull } from '../../types';

export type FolderRow = {
    type: 'folder';
    key: string;
    folder: FolderData;
    depth: number;
    hasChildren: boolean;
    expanded: boolean;
};

export type VaultRow<V> = { type: 'vault'; key: string; vault: V; hasFolders: boolean; expanded: boolean };
export type VaultFolderRow<V> = VaultRow<V> | FolderRow;

/** Recursively build alphabetically sorted folder rows with depth count.
 * Only expanded folders contribute their children to the flat row list. */
export const buildFolderRows = (
    children: FolderChildren,
    parentFolderId: MaybeNull<string>,
    depth: number,
    expandedKeys: ReadonlySet<string>
): FolderRow[] =>
    (children.get(parentFolderId) ?? []).flatMap((folder) => {
        const key = getFolderKey(folder.shareId, folder.folderId);
        const expanded = expandedKeys.has(key);

        const row: FolderRow = {
            type: 'folder',
            key,
            folder,
            depth,
            hasChildren: (children.get(folder.folderId) ?? []).length > 0,
            expanded,
        };

        return expanded ? [row, ...buildFolderRows(children, folder.folderId, depth + 1, expandedKeys)] : [row];
    });

export const buildVaultFolderRows = <V extends { shareId: string }>(
    vaults: V[],
    folders: FoldersByShareId,
    showFolders: boolean,
    expandedKeys: ReadonlySet<string>
): VaultFolderRow<V>[] =>
    vaults.flatMap((vault): VaultFolderRow<V>[] => {
        const children = getFolderChildren(folders[vault.shareId]);
        const key = getFolderKey(vault.shareId, null);
        const hasFolders = showFolders && (children.get(null) ?? []).length > 0;
        const expanded = expandedKeys.has(key);

        return [
            { type: 'vault', key, vault, hasFolders, expanded },
            ...(hasFolders && expanded ? buildFolderRows(children, null, 1, expandedKeys) : []),
        ];
    });

/** Expansion keys revealing `folderId` inside `shareId`: its vault row and every
 * folder down the path, target included so its subfolders are reachable even when
 * its own row is disabled. */
export const getExpandedFolderKeys = (
    folders: FoldersByShareId,
    shareId: MaybeNull<string>,
    folderId: MaybeNull<string>
): string[] => {
    if (!shareId) return [];

    const path = resolveFolderPath(folders[shareId], folderId);
    return [getFolderKey(shareId, null), ...path.map((folder) => getFolderKey(shareId, folder.folderId))];
};
