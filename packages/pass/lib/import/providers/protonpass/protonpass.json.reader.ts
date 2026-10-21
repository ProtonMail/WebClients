import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { ItemState } from '../../../../types/data/items';
import type { ItemImportIntent } from '../../../../types/data/items.dto';
import { AutofillMode } from '../../../../types/protobuf';
import type { MaybeNull } from '../../../../types/utils';
import { partition } from '../../../../utils/array/partition';
import { prop } from '../../../../utils/fp/lens';
import { logger } from '../../../../utils/logger';
import { semver } from '../../../../utils/string/semver';
import { uniqueId } from '../../../../utils/string/unique-id';
import { archivePath } from '../../../export/archive';
import type { ExportData, ExportedFolder, ExportedItem } from '../../../export/types';
import { obfuscateItem } from '../../../items/item.obfuscation';
import { ImportProviderError } from '../../helpers/error';
import { sanitizeAutofillUrls } from '../../helpers/transformers';
import type { ImportFolder, ImportReaderResult, ImportVault } from '../../types';

type ProtonPassReaderPayload = {
    /** list of current email aliases so we don't import
     * them again if they are present in the data file,
     * otherwise BE will throw an error. */
    currentAliases: string[];
    passphrase?: string;
    userId?: string;
    onPassphrase: () => Promise<string>;
};

/** Orders folders parent-first, as the export order is not guaranteed.
 * A folder whose parent is missing from the export moves to the vault root. */
const getImportFolders = (exportedFolders: ExportedFolder[]): ImportFolder[] => {
    const byId = new Map(exportedFolders.map((folder) => [folder.folderId, folder]));

    const children = new Map<MaybeNull<string>, ImportFolder[]>();

    for (const folder of byId.values()) {
        const parentExported = folder.parentFolderId !== null && byId.has(folder.parentFolderId);
        const parentId = parentExported ? folder.parentFolderId : null;
        const siblings = children.get(parentId) ?? [];
        siblings.push({ id: folder.folderId, name: folder.name, parentId });
        children.set(parentId, siblings);
    }

    const withDescendants = (folder: ImportFolder): ImportFolder[] => [
        folder,
        ...(children.get(folder.id) ?? []).flatMap(withDescendants),
    ];

    return (children.get(null) ?? []).flatMap(withDescendants);
};

export const readProtonPassJSON = (
    exportData: string,
    payload: ProtonPassReaderPayload,
    attachments: boolean
): ImportReaderResult => {
    try {
        if (!exportData) throw new Error('Invalid archive');
        const parsedExport = JSON.parse(exportData) as ExportData;
        const { userId } = parsedExport;

        /* when trying to import alias items : make sure the userId between
         * the exported file and the current userId match. We won't be able
         * to re-create the aliases if they're not user-owned */
        const aliasOwnedByUser = (item: ExportedItem) =>
            item.data.type === 'alias' ? userId === payload.userId : true;

        const vaults = Object.values(parsedExport.vaults).map<{ vault: ImportVault; ignored: string[] }>(
            ({ name, folders = [], items }) => {
                const [itemsToImport, ignoredAliases] = partition(items, aliasOwnedByUser);
                const orderedFolders = getImportFolders(folders);
                const folderIds = new Set(orderedFolders.map(prop('id')));

                return {
                    vault: {
                        name: name,
                        shareId: null,
                        folders: orderedFolders,
                        items: itemsToImport.reduce<ItemImportIntent[]>((acc, item) => {
                            /* Don't import existing aliases */
                            if (
                                item.data.type === 'alias' &&
                                item.aliasEmail &&
                                payload.currentAliases.includes(item.aliasEmail)
                            ) {
                                return acc;
                            }

                            /* Migrate username to itemEmail */
                            if (semver(parsedExport.version) < semver('1.18.0')) {
                                if (item.data.type === 'login' && 'username' in item.data.content) {
                                    const { username } = item.data.content;
                                    item.data.content.itemEmail = typeof username === 'string' ? username : '';
                                    item.data.content.itemUsername = '';
                                    delete item.data.content.username;
                                }
                            }

                            // Migrate urls -> autofillUrls. When `autofillUrls` is present it is
                            // authoritative (full set of modes); the legacy `urls` is only a
                            // duplicate of the Default entries. Fall back to it for old exports.
                            if (item.data.type === 'login') {
                                const { autofillUrls, urls } = item.data.content as {
                                    autofillUrls?: { url: string; mode: AutofillMode }[];
                                    urls?: string[];
                                };
                                const rawAutofillUrls = autofillUrls?.length
                                    ? autofillUrls
                                    : (urls ?? []).map((url) => ({ url, mode: AutofillMode.Default }));
                                item.data.content.autofillUrls = sanitizeAutofillUrls(rawAutofillUrls);
                            }

                            acc.push({
                                ...obfuscateItem({
                                    ...item.data,
                                    metadata: { ...item.data.metadata, itemUuid: uniqueId() },
                                    ...(item.data.type === 'alias'
                                        ? { extraData: { aliasEmail: item.aliasEmail! } }
                                        : {}),
                                }),
                                trashed: item.state === ItemState.Trashed,
                                folderId: item.folderId && folderIds.has(item.folderId) ? item.folderId : null,
                                createTime: item.createTime,
                                modifyTime: item.modifyTime,
                                files: attachments
                                    ? (item.files?.map((filename) => archivePath(filename, 'files')) ?? [])
                                    : [],
                            } as ItemImportIntent);

                            return acc;
                        }, []),
                    },
                    ignored: ignoredAliases.map((item) => `[Alias] ${item.aliasEmail}`),
                };
            }
        );

        return {
            vaults: vaults.map(prop('vault')),
            ignored: vaults.flatMap(prop('ignored')),
            warnings: [],
        };
    } catch (e) {
        logger.warn('[Importer::Proton]', e);
        throw new ImportProviderError(PASS_APP_NAME, e);
    }
};
