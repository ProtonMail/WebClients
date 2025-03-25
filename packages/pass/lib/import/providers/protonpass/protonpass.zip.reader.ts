import { c } from 'ttag';

import { decryptPassExport } from '@proton/pass/lib/crypto/utils/export';
import { archivePath } from '@proton/pass/lib/export/archive';
import type { ExportData, ExportedItem } from '@proton/pass/lib/export/types';
import { ImportProviderError, ImportReaderError } from '@proton/pass/lib/import/helpers/error';
import { readZIP } from '@proton/pass/lib/import/helpers/zip.reader';
import type { ImportReaderResult, ImportVault } from '@proton/pass/lib/import/types';
import { obfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import { type ItemImportIntent, ItemState } from '@proton/pass/types';
import { partition } from '@proton/pass/utils/array/partition';
import { prop } from '@proton/pass/utils/fp/lens';
import { logger } from '@proton/pass/utils/logger';
import { semver } from '@proton/pass/utils/string/semver';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';

type ProtonPassReaderPayload = {
    /** list of current email aliases so we don't import
     * them again if they are present in the data file,
     * otherwise BE will throw an error. */
    currentAliases: string[];
    passphrase?: string;
    userId?: string;
};

export const decryptProtonPassImport = async (data: Blob, passphrase?: string): Promise<Uint8Array> => {
    try {
        return await decryptPassExport(data, passphrase ?? '');
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

export const readProtonPassZIP = async (file: File, payload: ProtonPassReaderPayload): Promise<ImportReaderResult> => {
    try {
        const fileReader = await readZIP(file);

        const exportData = await (async () => {
            if (fileReader.files.has(archivePath('data.pgp')) && payload.passphrase) {
                const encrypted = (await fileReader.getFile(archivePath('data.pgp')))!;
                const decrypted = await decryptPassExport(encrypted, payload.passphrase);
                return uint8ArrayToString(decrypted);
            }

            if (fileReader.files.has(archivePath('data.json'))) {
                const data = (await fileReader.getFile(archivePath('data.json')))!;
                return data.text();
            }

            return '';
        })();

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
                                    ...(item.data.type === 'alias'
                                        ? { extraData: { aliasEmail: item.aliasEmail! } }
                                        : {}),
                                }),
                                trashed: item.state === ItemState.Trashed,
                                createTime: item.createTime,
                                modifyTime: item.modifyTime,
                                files: item.files?.map((filename) => archivePath(filename, 'files')) ?? [],
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
            fileReader,
        };
    } catch (e) {
        logger.warn('[Importer::Proton]', e);
        throw new ImportProviderError(PASS_APP_NAME, e);
    }
};
