import { archivePath } from '@proton/pass/lib/export/archive';
import type { ExportData, ExportedItem } from '@proton/pass/lib/export/types';
import { ImportProviderError } from '@proton/pass/lib/import/helpers/error';
import type { ImportReaderResult, ImportVault } from '@proton/pass/lib/import/types';
import { obfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import { type ItemImportIntent, ItemState } from '@proton/pass/types';
import { partition } from '@proton/pass/utils/array/partition';
import { prop } from '@proton/pass/utils/fp/lens';
import { logger } from '@proton/pass/utils/logger';
import { semver } from '@proton/pass/utils/string/semver';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

type ProtonPassReaderPayload = {
    /** list of current email aliases so we don't import
     * them again if they are present in the data file,
     * otherwise BE will throw an error. */
    currentAliases: string[];
    passphrase?: string;
    userId?: string;
    onPassphrase: () => Promise<string>;
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
            ({ name, items }) => {
                const [itemsToImport, ignoredAliases] = partition(items, aliasOwnedByUser);

                return {
                    vault: {
                        name: name,
                        shareId: null,
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

                            acc.push({
                                ...obfuscateItem({
                                    ...item.data,
                                    metadata: { ...item.data.metadata, itemUuid: uniqueId() },
                                    ...(item.data.type === 'alias'
                                        ? { extraData: { aliasEmail: item.aliasEmail! } }
                                        : {}),
                                }),
                                trashed: item.state === ItemState.Trashed,
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
