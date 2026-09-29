import { c, msgid } from 'ttag';

import type { ItemImportIntent, Maybe, MaybeNull } from '../../../types';
import { uniqueId } from '../../../utils/string/unique-id';
import type { FolderLimitReason, FolderLimits, FoldersById } from '../../folders/folder.utils';
import { getFolderChildren, getFolderLimitReason, resolveFolderPath } from '../../folders/folder.utils';
import type { ImportFolder, ImportVault } from '../types';
import { getImportedVaultName } from './transformers';

type ImportFolderTreeOptions = {
    /** Omit it to treat the whole string as one folder name. Only pass one for
     * formats whose names are actually paths. */
    separator?: string;
};

export type ImportFolderTree = {
    /** Parent-first */
    folders: ImportFolder[];
    /** Adds any missing folder along the path, returns the last one's id.
     * `null` for an empty path, meaning the vault root. */
    add: (path: Maybe<MaybeNull<string | string[]>>) => MaybeNull<string>;
};

/** Nested (rather than a flattened string key like `${parentId}::${name}`)
 * so `parent` and `name` can't merge into one colliding key */
const createNameIndex = () => {
    const index = new Map<MaybeNull<string>, Map<string, string>>();

    return {
        get: (parentId: MaybeNull<string>, name: string): Maybe<string> => index.get(parentId)?.get(name),
        set: (parentId: MaybeNull<string>, name: string, id: string) => {
            const siblings = index.get(parentId);
            if (siblings) siblings.set(name, id);
            else index.set(parentId, new Map([[name, id]]));
        },
    };
};

export const createImportFolderTree = ({ separator }: ImportFolderTreeOptions = {}): ImportFolderTree => {
    const folders: ImportFolder[] = [];
    const nodes = createNameIndex();

    const segments = (path: Maybe<MaybeNull<string | string[]>>): string[] => {
        if (!path) return [];
        if (Array.isArray(path)) return path.map((segment) => segment.trim()).filter(Boolean);
        return (separator ? path.split(separator) : [path]).map((segment) => segment.trim()).filter(Boolean);
    };

    const add: ImportFolderTree['add'] = (path) =>
        segments(path).reduce<MaybeNull<string>>((parentId, name) => {
            const existing = nodes.get(parentId, name);
            if (existing) return existing;

            const id = uniqueId();
            nodes.set(parentId, name, id);
            folders.push({ id, name, parentId });
            return id;
        }, null);

    return { folders, add };
};

const getLimitWarning = (reason: FolderLimitReason, count: number): string => {
    switch (reason) {
        case 'count':
            return c('Warning').ngettext(
                msgid`${count} folder was not imported because this vault reached its folder limit. Its items were imported to the closest folder available.`,
                `${count} folders were not imported because this vault reached its folder limit. Their items were imported to the closest folder available.`,
                count
            );
        case 'children':
            return c('Warning').ngettext(
                msgid`${count} folder was not imported because its parent folder reached the maximum number of subfolders. Its items were imported to the closest folder available.`,
                `${count} folders were not imported because their parent folder reached the maximum number of subfolders. Their items were imported to the closest folder available.`,
                count
            );
        case 'depth':
            return c('Warning').ngettext(
                msgid`${count} folder was merged into its parent folder because the maximum nesting level was reached.`,
                `${count} folders were merged into their parent folder because the maximum nesting level was reached.`,
                count
            );
    }
};

export type ImportFolderPlan = {
    /** Parent-first. `parentId` is always a local folder id already seen in `reuse` or
     * earlier in `create`, never a real `FolderID`. */
    create: ImportFolder[];
    /** Local folder id → the existing `FolderID` it merges into */
    reuse: Record<string, string>;
    /** Every local folder id → the folder where its items land. Itself if created or
     * reused; a fallback parent if blocked by folder limits. Null means vault root. */
    redirect: Record<string, MaybeNull<string>>;
    warnings: string[];
};

/** Determines which of an import's folders can be created in the target share,
 * given what it already holds and the folder limits. A folder that cannot be
 * created sends its items to the closest existing parent instead.
 * `folders` must be parent-first, otherwise a folder listed before its parent
 * would land at the vault root. */
export const planImportFolders = (
    folders: ImportFolder[],
    { existing, limits }: { existing: FoldersById; limits: FolderLimits }
): ImportFolderPlan => {
    const create: ImportFolder[] = [];
    const reuse: Record<string, string> = {};
    const redirect: Record<string, MaybeNull<string>> = {};
    const blocked: Partial<Record<FolderLimitReason, number>> = {};
    const blockedBy = new Map<string, FolderLimitReason>();

    const children = getFolderChildren(existing);
    const existingNames = createNameIndex();
    Object.values(existing).forEach((folder) => existingNames.set(folder.parentFolderId, folder.name, folder.folderId));

    /** Keyed by local folder id, `null` for the vault root. A reused folder is keyed
     * by its local id too, never by the `FolderID` it merges into. */
    const names = createNameIndex();
    const siblings = new Map<MaybeNull<string>, number>([[null, children.get(null)?.length ?? 0]]);
    const depths = new Map<string, number>();
    let total = Object.keys(existing).length;

    for (const folder of folders) {
        const parent = folder.parentId ? (redirect[folder.parentId] ?? null) : null;
        const name = folder.name.trim();

        // edge case: drop children of a dropped folder too, else they may merge into an unrelated folder with the same name
        const parentBlockedBy = folder.parentId ? blockedBy.get(folder.parentId) : undefined;
        if (parentBlockedBy) {
            redirect[folder.id] = parent;
            blockedBy.set(folder.id, parentBlockedBy);
            blocked[parentBlockedBy] = (blocked[parentBlockedBy] ?? 0) + 1;
            continue;
        }

        const seen = names.get(parent, name);
        if (seen) {
            redirect[folder.id] = seen;
            continue;
        }

        /** undefined when parent is a newly-created folder. */
        const parentFolderId = parent === null ? null : reuse[parent];
        const match = parentFolderId !== undefined ? existingNames.get(parentFolderId, name) : undefined;

        if (match) {
            // Reuse: folder with this name already exists under this parent
            reuse[folder.id] = match;
            redirect[folder.id] = folder.id;
            names.set(parent, name, folder.id);
            depths.set(folder.id, resolveFolderPath(existing, match).length);
            siblings.set(folder.id, children.get(match)?.length ?? 0);
            continue;
        }

        const parentDepth = parent ? (depths.get(parent) ?? 0) : 0;
        const reason = getFolderLimitReason({ total, siblings: siblings.get(parent) ?? 0, parentDepth }, limits);

        if (reason) {
            // Limit hit: skip this folder, items go to parent instead
            redirect[folder.id] = parent;
            blocked[reason] = (blocked[reason] ?? 0) + 1;
            blockedBy.set(folder.id, reason);
            continue;
        }

        create.push({ id: folder.id, name, parentId: parent });
        redirect[folder.id] = folder.id;
        names.set(parent, name, folder.id);
        depths.set(folder.id, parentDepth + 1);
        siblings.set(parent, (siblings.get(parent) ?? 0) + 1);
        total++;
    }

    const warnings = Object.entries(blocked).map(([reason, count]) =>
        getLimitWarning(reason as FolderLimitReason, count)
    );

    return { create, reuse, redirect, warnings };
};

/** Used when folders are unavailable: each folder with items becomes its own
 * vault named after its path, to keep old behavior before folder support. */
export const splitFoldersIntoVaults = (vaults: ImportVault[]): ImportVault[] =>
    vaults.flatMap((vault) => {
        if (vault.folders.length === 0) return [vault];

        const byId = new Map(vault.folders.map((folder) => [folder.id, folder]));
        const pathOf = (folder: ImportFolder): string => {
            const parent = folder.parentId ? byId.get(folder.parentId) : undefined;
            return parent ? `${pathOf(parent)}/${folder.name}` : folder.name;
        };

        const rootItems: ItemImportIntent[] = [];
        const folderItems = new Map<string, ItemImportIntent[]>();

        for (const item of vault.items) {
            const folderId = item.folderId && byId.has(item.folderId) ? item.folderId : null;
            if (folderId) {
                const items = folderItems.get(folderId) ?? [];
                items.push({ ...item, folderId: null });
                folderItems.set(folderId, items);
            } else {
                rootItems.push({ ...item, folderId: null });
            }
        }

        const folderVaults = vault.folders.flatMap((folder): ImportVault[] => {
            const items = folderItems.get(folder.id);
            return items ? [{ name: getImportedVaultName(pathOf(folder)), shareId: null, folders: [], items }] : [];
        });

        return rootItems.length > 0 ? [{ ...vault, folders: [], items: rootItems }, ...folderVaults] : folderVaults;
    });
