import JSZip from 'jszip';
import { c } from 'ttag';

import { decryptPassExport } from '@proton/pass/lib/export/export';
import type { ExportData, ExportedItem } from '@proton/pass/lib/export/types';
import { ImportProviderError, ImportReaderError } from '@proton/pass/lib/import/helpers/error';
import type { ImportPayload, ImportReaderPayload, ImportVault } from '@proton/pass/lib/import/types';
import { obfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import { type ItemImportIntent, ItemState } from '@proton/pass/types';
import { partition } from '@proton/pass/utils/array/partition';
import type { TransferableFile } from '@proton/pass/utils/file/transferable-file';
import { prop } from '@proton/pass/utils/fp/lens';
import { logger } from '@proton/pass/utils/logger';
import { semver } from '@proton/pass/utils/string/semver';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

type ProtonPassReaderPayload = {
    /** unencrypted zip file as ArrayBuffer  */
    data: ArrayBuffer;
    /** list of current email aliases so we don't import them again if they are present in the data file, otherwise BE will throw an error */
    currentAliases: string[];
    userId?: string;
};

export const decryptProtonPassImport = async (payload: ImportReaderPayload): Promise<TransferableFile> => {
    try {
        const decrypted = await decryptPassExport(payload.file.base64, payload.passphrase ?? '');
        const base64 = uint8ArrayToBase64String(decrypted);
        return { ...payload.file, base64 };
    } catch (err: unknown) {
        if (err instanceof Error) {
            const errorDetail = err.message.includes('Error decrypting message')
                ? c('Error').t`Passphrase is incorrect`
                : c('Error').t`File could not be parsed`;

            throw new ImportReaderError(
                c('Error').t`Decrypting your ${PASS_APP_NAME} export file failed. ${errorDetail}`
            );
        }

        throw err;
    }
};

export const readProtonPassZIP = async (payload: ProtonPassReaderPayload): Promise<ImportPayload> => {
    try {
        const zipFile = await JSZip.loadAsync(payload.data);
        const zipObject = zipFile.file(`${PASS_APP_NAME}/data.json`);
        const exportData = await zipObject?.async('string');

        if (exportData === undefined) throw new Error();

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
                                    ...(item.data.type === 'alias'
                                        ? { extraData: { aliasEmail: item.aliasEmail! } }
                                        : {}),
                                }),
                                trashed: item.state === ItemState.Trashed,
                                createTime: item.createTime,
                                modifyTime: item.modifyTime,
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
